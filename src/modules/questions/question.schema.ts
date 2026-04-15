import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  text!: string;

  @Prop({
    type: [{ type: String, trim: true }],
    validate: {
      validator: (v: string[]) => v.length === 4,
      message: 'A question must have exactly 4 options',
    },
  })
  options!: string[];

  @Prop({ type: Number, required: true, min: 0, max: 3 })
  correctIndex!: number;

  @Prop({ type: Number, default: 0 })
  order!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index({ eventId: 1, isActive: 1 });