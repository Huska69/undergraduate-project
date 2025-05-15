import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Prediction } from './prediction.schema';
import { PredictionRequestDto, PredictionResponseDto } from './prediction.dto';

@Injectable()
export class PredictionsService {
  private readonly logger = new Logger(PredictionsService.name);
  private readonly modelApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Prediction.name) private predictionModel: Model<Prediction>,
    private configService: ConfigService,
  ) {
    this.modelApiUrl = this.configService.post<string>(
      'MODEL_API_URL',
      'http://localhost:5000/predict',
    );
  }

  async predictAndSave(
    data: PredictionRequestDto,
  ): Promise<PredictionResponseDto> {
    try {
      const { userId, xSeq, xStatic } = data;

      this.logger.debug(`Requesting prediction for user ${userId}`);

      const { data: predictionResponse } = await this.httpService.axiosRef.post(
        `${this.modelApiUrl}/predict`,
        { x_seq: xSeq, x_static: xStatic, user_id: userId },
        { timeout: 5000 },
      );

      if (
        !predictionResponse.prediction ||
        !Array.isArray(predictionResponse.prediction)
      ) {
        throw new BadRequestException(
          'Invalid prediction response from model API',
        );
      }

      const prediction = new this.predictionModel({
        userId,
        values: predictionResponse.prediction,
      });

      await prediction.save();

      this.logger.debug(`Saved prediction for user ${userId}`);

      return {
        userId: prediction.userId,
        values: prediction.values,
        createdAt: prediction.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error predicting glucose values: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.response) {
        throw new BadRequestException(
          `Model API error: ${error.response.data?.error || 'Unknown error'}`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to process glucose prediction',
      );
    }
  }

  async getUserPredictions(
    userId: string,
    limit = 10,
  ): Promise<PredictionResponseDto[]> {
    const predictions = await this.predictionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return predictions.map((pred) => ({
      userId: pred.userId,
      values: pred.values,
      createdAt: pred.createdAt,
    }));
  }
}
