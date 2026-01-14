// src/modules/sessions/schemas/session.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true })
export class Session {
  @Prop({
    required: true,
    trim: true,
    maxlength: 80,
  })
  name!: string; // e.g. "Day 1", "January 14", "Dell Booth - Day 2"

  @Prop({
    default: false,
    index: true,
  })
  active!: boolean;

  @Prop({
    required: true,
    default: 1,
    min: 1,
    index: true,
  })
  dayNumber!: number;

  @Prop({
    default: null,
  })
  startsAt?: Date | null;

  @Prop({
    default: null,
  })
  endsAt?: Date | null;

  @Prop({
    default: null,
    trim: true,
    maxlength: 200,
  })
  note?: string | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Helpful indexes
SessionSchema.index({ active: 1, dayNumber: 1 });
SessionSchema.index({ startsAt: 1 });
SessionSchema.index({ endsAt: 1 });

// Optional: ensure only ONE active session at a time (best effort).
// Mongo can't truly enforce "only one true" without extra logic,
// but this helps you query fast and build rules in the service.
