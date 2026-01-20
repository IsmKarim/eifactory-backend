import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name!: string; // "Day 1", "2026-01-20", "Dell Booth - Day 2"

  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    maxlength: 80,
  })
  slug!: string; // "day-1", "2026-01-20"

  @Prop({ required: true, min: 1, index: true })
  dayNumber!: number;

  @Prop({ default: false, index: true })
  active!: boolean;

  @Prop({ default: null })
  startsAt?: Date | null;

  @Prop({ default: null })
  endsAt?: Date | null;

  @Prop({ default: null, trim: true, maxlength: 200 })
  note?: string | null;

  @Prop({
    type: [{ type: Types.ObjectId, ref: "Attempt" }],
    default: [],
  })
  winnerAttemptIds!: Types.ObjectId[];

  @Prop({ default: null })
  winnersDeclaredAt?: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ active: 1, dayNumber: 1 });
SessionSchema.index({ startsAt: 1 });
SessionSchema.index({ endsAt: 1 });
