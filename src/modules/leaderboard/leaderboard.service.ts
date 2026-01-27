import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Attempt, AttemptDocument } from "../attempts/schemas/attempt.schema";
import { Session, SessionDocument } from "../session/session.schema";
import { AttemptStatus } from "src/common/enums/attempt-status.enums";

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Attempt.name) private readonly attemptModel: Model<AttemptDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
  ) {}

  private rankAttempts(attempts: any[]) {
    // already sorted; assign rank 1..N
    return attempts.map((a, idx) => ({
      rank: idx + 1,
      attemptId: String(a._id),
      participant: a.participantId
        ? {
            id: String(a.participantId._id ?? a.participantId),
            username: a.participantId.username,
            email: a.participantId.email,
            phone: a.participantId.phone,
          }
        : null,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      elapsedMs: a.elapsedMs,
      submittedAt: a.submittedAt,
    }));
  }

  private async leaderboardForSession(session: any, limit: number) {
    const attempts = await this.attemptModel
      .find({
        sessionId: session._id,
        status: AttemptStatus.SUBMITTED,
        elapsedMs: { $ne: null }, // safety
      })
      .sort({ score: -1, elapsedMs: 1, submittedAt: 1 })
      .limit(limit)
      .populate("participantId", "username email phone")
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
      entries: this.rankAttempts(attempts),
    };
  }

  async getLeaderboardGroupedBySessions(opts: { sessionId?: string; limit?: number }) {
    const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);

    // One session
    if (opts.sessionId) {
      if (!Types.ObjectId.isValid(opts.sessionId)) {
        throw new BadRequestException("Invalid sessionId.");
      }

      const session = await this.sessionModel.findById(opts.sessionId).lean();
      if (!session) throw new NotFoundException("Session not found.");

      return [await this.leaderboardForSession(session, limit)];
    }

    // All sessions (sorted so UI looks sane)
    const sessions = await this.sessionModel
      .find()
      .sort({ dayNumber: 1, startsAt: 1, createdAt: 1 })
      .lean();

    const results: any[] = [];
    for (const s of sessions) {
      results.push(await this.leaderboardForSession(s, limit));
    }

    return results;
  }
}
