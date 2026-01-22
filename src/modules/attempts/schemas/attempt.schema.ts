import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { AttemptStatus } from "../../../common/enums/attempt-status.enum";

export type AttemptDocument = HydratedDocument<Attempt>;

@Schema({ _id: false })
export class AttemptAnswer {
  @Prop({ required: true, trim: true })
  questionId!: string;

  @Prop({ required: true, trim: true })
  choiceId!: string;
}

export const AttemptAnswerSchema = SchemaFactory.createForClass(AttemptAnswer);

@Schema({ timestamps: true })
export class Attempt {
  @Prop({ type: Types.ObjectId, ref: "Participant", required: true, index: true })
  participantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Session", required: true, index: true })
  sessionId!: Types.ObjectId;

  @Prop({ required: true, enum: AttemptStatus, default: AttemptStatus.CREATED, index: true })
  status!: AttemptStatus;

  // unions need explicit type for nest/mongoose
  @Prop({ type: Date, default: null })
  startedAt!: Date | null;

  @Prop({ type: Date, default: null })
  submittedAt!: Date | null;

  @Prop({ type: Number, default: null, min: 0 })
  elapsedMs!: number | null;

  @Prop({ type: [AttemptAnswerSchema], default: [] })
  answers!: AttemptAnswer[];

  // scoring snapshot
  @Prop({ type: Number, default: 0, min: 0 })
  score!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  correctCount!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  totalQuestions!: number;

  @Prop({ required: true, trim: true })
  questionsVersion!: string;

  // optional metadata (helpful for debugging)
  @Prop({ default: null, trim: true, maxlength: 200 })
  userAgent!: string | null;

  @Prop({ default: null, trim: true, maxlength: 60 })
  ip!: string | null;
}

export const AttemptSchema = SchemaFactory.createForClass(Attempt);

/**
 * One attempt per participant per session (simple & clean).
 * This enforces your "already participated" rule once submitted,
 * and prevents duplicates caused by refresh.
 */
AttemptSchema.index({ participantId: 1, sessionId: 1 }, { unique: true });

AttemptSchema.index({ sessionId: 1, score: -1, elapsedMs: 1 });
AttemptSchema.index({ sessionId: 1, submittedAt: -1 });
