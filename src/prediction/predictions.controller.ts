import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { PredictionRequestDto, PredictionResponseDto } from './prediction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('predictions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly service: PredictionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new glucose prediction' })
  @ApiResponse({
    status: 201,
    description: 'Prediction created successfully',
    type: PredictionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createPrediction(
    @Body() predictionData: PredictionRequestDto,
  ): Promise<PredictionResponseDto> {
    return this.service.predictAndSave(predictionData);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get predictions for a user' })
  @ApiResponse({
    status: 200,
    description: 'User predictions retrieved',
    type: [PredictionResponseDto],
  })
  async getUserPredictions(
    @Param('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PredictionResponseDto[]> {
    return this.service.getUserPredictions(userId, limit);
  }
}
