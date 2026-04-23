import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attempt, AttemptDocument } from '../attempts/schemas/attempt.schema';
import { Session, SessionDocument } from '../session/session.schema';
import { Participant, ParticipantDocument } from '../participants/schemas/participant.schema';
import { Event, EventDocument } from '../events/event.schema';
import { AttemptStatus } from 'src/common/enums/attempt-status.enums';

type WinEntry = {
  attemptId: string;
  sessionId: string;
  sessionName: string;
  sessionSlug: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
};

type PreviousWinsMaps = {
  byParticipantId: Map<string, WinEntry[]>;
  byEmail: Map<string, WinEntry[]>;
  byPhone: Map<string, WinEntry[]>;
};

function addToMap(map: Map<string, WinEntry[]>, key: string | undefined | null, entry: WinEntry) {
  if (!key) return;
  const existing = map.get(key);
  if (existing) existing.push(entry);
  else map.set(key, [entry]);
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Attempt.name) private readonly attemptModel: Model<AttemptDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Participant.name) private readonly participantModel: Model<ParticipantDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
  ) {}

  /**
   * Builds three lookup maps (participantId, email, phone) → sessions they won.
   * Each win entry includes full session + event context so the caller knows
   * exactly which event/session the prior win came from.
   */
  private async buildPreviousWinsMaps(): Promise<PreviousWinsMaps> {
    const byParticipantId = new Map<string, WinEntry[]>();
    const byEmail = new Map<string, WinEntry[]>();
    const byPhone = new Map<string, WinEntry[]>();

    const sessionsWithWinners = await this.sessionModel
      .find({ 'winnerAttemptIds.0': { $exists: true } })
      .lean();

    if (sessionsWithWinners.length === 0) return { byParticipantId, byEmail, byPhone };

    // Fetch events for these sessions so we can include event context in each win entry
    const eventIds = [...new Set(sessionsWithWinners.map((s) => String(s.eventId)))];
    const events = await this.eventModel
      .find({ _id: { $in: eventIds.map((id) => new Types.ObjectId(id)) } })
      .select('_id name slug')
      .lean();

    const eventMap = new Map(events.map((e) => [String(e._id), e]));

    // Flatten: one record per (session, winnerAttemptId)
    const winnerAttemptEntries = sessionsWithWinners.flatMap((s) => {
      const event = eventMap.get(String(s.eventId));
      return (s.winnerAttemptIds ?? []).map((id) => ({
        sessionId: String(s._id),
        sessionName: s.name,
        sessionSlug: s.slug,
        eventId: String(s.eventId),
        eventName: event?.name ?? '',
        eventSlug: (event as any)?.slug ?? '',
        attemptId: String(id),
      }));
    });

    // Resolve participantId for each winner attempt
    const winnerAttempts = await this.attemptModel
      .find({ _id: { $in: winnerAttemptEntries.map((w) => new Types.ObjectId(w.attemptId)) } })
      .select('_id participantId')
      .lean();

    const attemptToParticipantId = new Map<string, string>(
      winnerAttempts.map((a) => [String(a._id), String(a.participantId)]),
    );

    // Fetch participant email + phone for email/phone-based matching
    const participantIds = [...new Set(winnerAttempts.map((a) => a.participantId))];
    const participants = await this.participantModel
      .find({ _id: { $in: participantIds } })
      .select('_id email phone')
      .lean();

    const participantDetails = new Map(
      participants.map((p) => [String(p._id), { email: p.email?.toLowerCase(), phone: p.phone }]),
    );

    for (const w of winnerAttemptEntries) {
      const participantId = attemptToParticipantId.get(w.attemptId);
      if (!participantId) continue;

      const entry: WinEntry = {
        attemptId: w.attemptId,
        sessionId: w.sessionId,
        sessionName: w.sessionName,
        sessionSlug: w.sessionSlug,
        eventId: w.eventId,
        eventName: w.eventName,
        eventSlug: w.eventSlug,
      };

      addToMap(byParticipantId, participantId, entry);

      const details = participantDetails.get(participantId);
      addToMap(byEmail, details?.email, entry);
      addToMap(byPhone, details?.phone, entry);
    }

    return { byParticipantId, byEmail, byPhone };
  }

  private resolveWins(
    participantId: string,
    email: string | undefined,
    phone: string | undefined,
    maps: PreviousWinsMaps,
    currentSessionId: string,
  ): WinEntry[] {
    const seen = new Set<string>();
    const wins: WinEntry[] = [];

    const candidates = [
      ...(maps.byParticipantId.get(participantId) ?? []),
      ...(email ? (maps.byEmail.get(email.toLowerCase()) ?? []) : []),
      ...(phone ? (maps.byPhone.get(phone) ?? []) : []),
    ];

    for (const w of candidates) {
      if (w.sessionId === currentSessionId) continue; // skip current session's own wins
      if (seen.has(w.attemptId)) continue;            // deduplicate
      seen.add(w.attemptId);
      wins.push(w);
    }

    return wins;
  }

  private rankAttempts(attempts: any[], currentSessionId: string, maps: PreviousWinsMaps) {
    return attempts.map((a, idx) => {
      const participantId = String(a.participantId?._id ?? a.participantId ?? '');
      const email: string | undefined = a.participantId?.email;
      const phone: string | undefined = a.participantId?.phone;

      const previousWins = this.resolveWins(participantId, email, phone, maps, currentSessionId);

      return {
        rank: idx + 1,
        attemptId: String(a._id),
        participant: a.participantId
          ? {
              id: participantId,
              username: a.participantId.username,
              companyName: a.participantId.companyName,
              email,
              phone,
            }
          : null,
        score: a.score,
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
        elapsedMs: a.elapsedMs,
        submittedAt: a.submittedAt,
        hasPreviousWins: previousWins.length > 0,
        previousWins,
      };
    });
  }

  private async leaderboardForSession(session: any, limit: number, maps: PreviousWinsMaps) {
    const attempts = await this.attemptModel
      .find({
        sessionId: session._id,
        status: AttemptStatus.SUBMITTED,
        elapsedMs: { $ne: null },
      })
      .sort({ score: -1, elapsedMs: 1, submittedAt: 1 })
      .limit(limit)
      .populate('participantId', 'username email phone companyName')
      .lean();

    return {
      session: {
        id: String(session._id),
        name: session.name,
        slug: session.slug,
        dayNumber: session.dayNumber,
        active: session.active,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        winnersDeclaredAt: session.winnersDeclaredAt ?? null,
        winnerAttemptIds: (session.winnerAttemptIds ?? []).map((x: any) => String(x)),
      },
      entries: this.rankAttempts(attempts, String(session._id), maps),
    };
  }

  async getLeaderboardGroupedBySessions(opts: { sessionId?: string; limit?: number }) {
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);

    const maps = await this.buildPreviousWinsMaps();

    if (opts.sessionId) {
      if (!Types.ObjectId.isValid(opts.sessionId)) {
        throw new BadRequestException('Invalid sessionId.');
      }

      const session = await this.sessionModel.findById(opts.sessionId).lean();
      if (!session) throw new NotFoundException('Session not found.');

      return [await this.leaderboardForSession(session, limit, maps)];
    }

    const sessions = await this.sessionModel
      .find()
      .sort({ dayNumber: 1, startsAt: 1, createdAt: 1 })
      .lean();

    const results: any[] = [];
    for (const s of sessions) {
      results.push(await this.leaderboardForSession(s, limit, maps));
    }

    return results;
  }
}
