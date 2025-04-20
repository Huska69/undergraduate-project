import {
  IsArray,
  IsString,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PredictionRequestDto {
  @IsString()
  userId: string;

  @IsArray()
  @ArrayMinSize(36)
  @ArrayMaxSize(36)
  @IsNumber({}, { each: true })
  xSeq: number[];

  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @IsNumber({}, { each: true })
  xStatic: number[];
}

export class PredictionResponseDto {
  userId: string;
  values: number[];
  createdAt: Date;
}
