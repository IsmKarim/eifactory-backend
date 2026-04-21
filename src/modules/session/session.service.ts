import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSessionDto } from './dto/createSession.dto';
import { DeclareWinnersDto } from './dto/declare-winners.dto';
import { Session, SessionDocument } from './session.schema';

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function isoDateSlug(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async listSessions(eventId: string) {
    if (!Types.ObjectId.isValid(eventId))
      throw new BadRequestException('Invalid event id.');
    return this.sessionModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getActiveSession(eventId: string) {
    if (!Types.ObjectId.isValid(eventId))
      throw new BadRequestException('Invalid event id.');
    const activeSession = await this.sessionModel.findOne({
      eventId: new Types.ObjectId(eventId),
      active: true,
    });
    if (!activeSession) throw new NotFoundException('No active session found.');
    return activeSession.toObject();
  }

  async startSession(eventId: string, dto: CreateSessionDto) {
    if (!Types.ObjectId.isValid(eventId))
      throw new BadRequestException('Invalid event id.');
    const eventObjId = new Types.ObjectId(eventId);
    const now = new Date();

    await this.sessionModel.updateMany(
      { eventId: eventObjId, active: true },
      { $set: { active: false, endsAt: now } },
    );

    const name = isoDateSlug(now);
    const slug = dto.slug?.trim()
      ? slugify(dto.slug)
      : slugify(name) || isoDateSlug(now);
    if (!slug) throw new BadRequestException('Invalid session slug.');

    const dayNumber =
      dto.dayNumber ??
      ((
        await this.sessionModel
          .findOne({ eventId: eventObjId })
          .sort({ dayNumber: -1 })
          .lean()
      )?.dayNumber ?? 0) + 1;

    const existing = await this.sessionModel.findOne({
      eventId: eventObjId,
      slug,
    });

    if (existing) {
      existing.name = name;
      existing.dayNumber = dayNumber;
      existing.note = dto.note ?? existing.note ?? null;
      existing.active = true;
      existing.startsAt = existing.startsAt ?? now;
      existing.endsAt = null;
      await existing.save();
      return existing.toObject();
    }

    try {
      const created = await this.sessionModel.create({
        eventId: eventObjId,
        name,
        slug,
        dayNumber,
        note: dto.note ?? null,
        active: true,
        startsAt: now,
        endsAt: null,
        winnerAttemptIds: [],
        winnersDeclaredAt: null,
      });
      return created.toObject();
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Another session is already active for this event.');
      }
      throw err;
    }
  }

  async endActiveSession(eventId: string) {
    if (!Types.ObjectId.isValid(eventId))
      throw new BadRequestException('Invalid event id.');
    const now = new Date();
    const active = await this.sessionModel.findOne({
      eventId: new Types.ObjectId(eventId),
      active: true,
    });
    if (!active) throw new NotFoundException('No active session to end.');

    active.active = false;
    active.endsAt = now;
    await active.save();
    return active.toObject();
  }

  async getSessionById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid session id.');
    const session = await this.sessionModel.findById(id).lean();
    if (!session) throw new NotFoundException('Session not found.');
    return session;
  }

  async declareWinners(sessionId: string, dto: DeclareWinnersDto) {
    if (!Types.ObjectId.isValid(sessionId))
      throw new BadRequestException('Invalid session id.');

    const uniqueAttemptIds = Array.from(new Set(dto.attemptIds)).map(
      (id) => new Types.ObjectId(id),
    );

    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found.');

    session.winnerAttemptIds = uniqueAttemptIds;
    session.winnersDeclaredAt = new Date();
    await session.save();

    return session.toObject();
  }
}
