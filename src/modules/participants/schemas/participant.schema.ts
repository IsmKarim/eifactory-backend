import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ParticipantDocument = HydratedDocument<Participant>;

@Schema({ timestamps: true })
export class Participant {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 60 })
  username!: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    maxlength: 120,
  })
  email!: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 20,
    index: true,
  })
  phone!: string; // store normalized (digits, optional leading +)

  @Prop({ type: Date, default: null })
  lastSeenAt!: Date | null;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

ParticipantSchema.index({ email: 1 }, { unique: true });
ParticipantSchema.index({ phone: 1 });
ParticipantSchema.index({ lastSeenAt: -1 });
