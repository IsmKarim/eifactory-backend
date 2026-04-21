import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  name!: string; // "Day 1", "2026-01-20", "Dell Booth - Day 2"

  @Prop({
    required: true,
    index: true,
    trim: true,
    lowercase: true,
    maxlength: 80,
  })
  slug!: string; // "day-1", "2026-01-20" — unique per event via compound index

  @Prop({ required: true, min: 1, index: true })
  dayNumber!: number;

  @Prop({ default: false, index: true })
  active!: boolean;

  @Prop({ type: Date, default: null })
  startsAt!: Date | null;

  @Prop({ type: Date, default: null })
  endsAt!: Date | null;

  @Prop({ type: String, default: null, trim: true, maxlength: 200 })
  note?: string | null;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Attempt' }],
    default: [],
  })
  winnerAttemptIds!: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  winnersDeclaredAt?: Date | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ eventId: 1, slug: 1 }, { unique: true });
SessionSchema.index({ eventId: 1, active: 1, dayNumber: 1 });
// Enforce at most one active session per event at the DB level
SessionSchema.index(
  { eventId: 1, active: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
SessionSchema.index({ startsAt: 1 });
SessionSchema.index({ endsAt: 1 });
