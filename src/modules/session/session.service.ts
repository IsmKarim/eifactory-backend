import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateSessionDto } from "./dto/createSession.dto";
import { DeclareWinnersDto } from "./dto/declare-winners.dto";

import { Session, SessionDocument } from "./session.schema";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isoDateSlug(d = new Date()) {
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async listSessions() {
    return this.sessionModel.find().sort({ createdAt: -1 }).lean();
  }


  async getActiveSession() {
    const activeSession = await this.sessionModel.findOne({ active: true });
    if (!activeSession) {
      throw new NotFoundException("No active session found.");
    }
    return activeSession.toObject();
  }

  /**
   * Starts (activates) a session:
   * - Ends any currently active session
   * - Creates a new session OR re-activates an existing one by slug
   */
  async startSession(dto: CreateSessionDto) {
    const now = new Date();

    // Always end any currently active session first (keeps "only one active" rule simple)
    await this.sessionModel.updateMany(
      { active: true },
      { $set: { active: false, endsAt: now } },
    );

    const name = isoDateSlug(now);
    const slug = dto.slug?.trim()
      ? slugify(dto.slug)
      : slugify(name) || isoDateSlug(now);

    if (!slug) throw new BadRequestException("Invalid session slug.");

    // If dayNumber not provided: pick next day number (max + 1)
    const dayNumber =
      dto.dayNumber ??
      ((await this.sessionModel.findOne().sort({ dayNumber: -1 }).lean())?.dayNumber ?? 0) + 1;

    // If exists, reactivate it; else create
    const existing = await this.sessionModel.findOne({ slug });

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

    const created = await this.sessionModel.create({
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
  }

  async endActiveSession() {
    const now = new Date();
    const active = await this.sessionModel.findOne({ active: true });
    if (!active) throw new NotFoundException("No active session to end.");

    active.active = false;
    active.endsAt = now;
    await active.save();
    return active.toObject();
  }

  async getSessionById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid session id.");
    const session = await this.sessionModel.findById(id).lean();
    if (!session) throw new NotFoundException("Session not found.");
    return session;
  }

  async declareWinners(sessionId: string, dto: DeclareWinnersDto) {
    if (!Types.ObjectId.isValid(sessionId)) throw new BadRequestException("Invalid session id.");

    // De-duplicate attempt ids
    const uniqueAttemptIds = Array.from(new Set(dto.attemptIds)).map(
      (id) => new Types.ObjectId(id),
    );

    const session = await this.sessionModel.findById(sessionId);
    if (!session) throw new NotFoundException("Session not found.");

    session.winnerAttemptIds = uniqueAttemptIds;
    session.winnersDeclaredAt = new Date();
    await session.save();

    return session.toObject();
  }
}
