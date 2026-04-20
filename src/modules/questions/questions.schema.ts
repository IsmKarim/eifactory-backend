import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  text!: string;

  @Prop({
    type: [{ type: String, trim: true }],
    validate: {
      validator: (v: string[]) => v.length === 4,
      message: 'A question must have exactly 4 options',
    },
  })
  options!: string[]; // index 0 = A, 1 = B, 2 = C, 3 = D

  @Prop({ required: true, min: 0, max: 3 })
  correctIndex!: number; // index into options[]

  @Prop({ default: 0 })
  order!: number; // optional manual sort within the pool

  @Prop({ default: true })
  isActive!: boolean; // soft-disable without deleting
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Index for fast pool fetching: get all active questions for an event
QuestionSchema.index({ eventId: 1, isActive: 1 });
