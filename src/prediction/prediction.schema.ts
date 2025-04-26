import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Prediction extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, type: [Number] })
  values: number[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PredictionSchema = SchemaFactory.createForClass(Prediction);
PredictionSchema.index({ userId: 1, createdAt: -1 });
