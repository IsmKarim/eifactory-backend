import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

export enum EventStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.DRAFT })
  status!: EventStatus;

  // ── Landing page ────────────────────────────────────────────────────────────
  @Prop({
    type: {
      heroTitle: String,
      heroSubtitle: String,
      slogan: String,
      prizeDescription: String,
      prizeImageUrl: String,
    },
    _id: false,
    default: {},
  })
  landing!: {
    heroTitle?: string;
    heroSubtitle?: string;
    slogan?: string;
    prizeDescription?: string;
    prizeImageUrl?: string;
  };

  // ── Quiz configuration ──────────────────────────────────────────────────────
  @Prop({
    type: { questionCount: { type: Number, min: 1, default: 10 } },
    _id: false,
    default: {},
  })
  quiz!: {
    questionCount: number;
  };

  // ── Branding ────────────────────────────────────────────────────────────────
  @Prop({
    type: {
      logoUrl: String,
      primaryColor: String,
      organizerName: String,
    },
    _id: false,
    default: {},
  })
  branding!: {
    logoUrl?: string;
    primaryColor?: string;
    organizerName?: string;
  };

  // ── Products (CTA cards on landing page) ────────────────────────────────────
  @Prop({
    type: [
      {
        name: { type: String, required: true, trim: true },
        photoUrl: { type: String },
        link: { type: String, required: true },
        _id: false,
      },
    ],
    default: [],
  })
  products!: {
    name: string;
    photoUrl?: string;
    link: string;
  }[];
}

export const EventSchema = SchemaFactory.createForClass(Event);