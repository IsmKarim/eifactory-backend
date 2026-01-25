import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { AttemptStatus } from "src/common/enums/attempt-status.enums";

export type AttemptDocument = HydratedDocument<Attempt>;

@Schema({ _id: false })
export class AttemptAnswer {
  @Prop({ required: true, trim: true })
  questionId!: string;

  @Prop({ required: true, trim: true })
  choiceId!: string;
}
export const AttemptAnswerSchema = SchemaFactory.createForClass(AttemptAnswer);

@Schema({ _id: false })
export class AttemptQuestionChoice {
  @Prop({ required: true, trim: true, maxlength: 20 })
  id!: string;

  @Prop({ required: true, trim: true, maxlength: 300 })
  label!: string;
}
export const AttemptQuestionChoiceSchema =
  SchemaFactory.createForClass(AttemptQuestionChoice);

@Schema({ _id: false })
export class AttemptQuestion {
  @Prop({ required: true, trim: true, maxlength: 80 })
  questionId!: string;

  @Prop({ required: true, trim: true, maxlength: 800 })
  prompt!: string;

  @Prop({ type: [AttemptQuestionChoiceSchema], required: true })
  choices!: AttemptQuestionChoice[];

  // stored for stable scoring, NEVER returned publicly
  @Prop({ required: true, trim: true, maxlength: 20 })
  correctChoiceId!: string;

  @Prop({ type: Number, default: 1, min: 0 })
  points!: number;
}
export const AttemptQuestionSchema = SchemaFactory.createForClass(AttemptQuestion);

@Schema({ timestamps: true })
export class Attempt {
  @Prop({ type: Types.ObjectId, ref: "Participant", required: true, index: true })
  participantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Session", required: true, index: true })
  sessionId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: AttemptStatus,
    default: AttemptStatus.CREATED,
    index: true,
  })
  status!: AttemptStatus;

  @Prop({ type: Date, default: null })
  startedAt!: Date | null;

  @Prop({ type: Date, default: null })
  submittedAt!: Date | null;

  @Prop({ type: Number, default: null, min: 0 })
  elapsedMs!: number | null;

  // ✅ The 3 selected questions (snapshot)
  @Prop({ type: [AttemptQuestionSchema], default: [] })
  questions!: AttemptQuestion[];

  @Prop({ type: [AttemptAnswerSchema], default: [] })
  answers!: AttemptAnswer[];

  @Prop({ type: Number, default: 0, min: 0 })
  score!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  correctCount!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalQuestions!: number;

  @Prop({ required: true, trim: true })
  questionsVersion!: string;

  @Prop({ type: String, default: null, trim: true, maxlength: 200 })
  userAgent!: string | null;

  @Prop({ type: String, default: null, trim: true, maxlength: 60 })
  ip!: string | null;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);

AttemptSchema.index({ participantId: 1, sessionId: 1 }, { unique: true });
AttemptSchema.index({ sessionId: 1, score: -1, elapsedMs: 1 });
AttemptSchema.index({ sessionId: 1, submittedAt: -1 });
