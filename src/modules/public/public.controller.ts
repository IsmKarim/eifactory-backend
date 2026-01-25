import {
  Body,
  ConflictException,
  Controller,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";

import { ParticipantsService } from "../participants/participants.service";
import { AttemptsService } from "../attempts/attempts.service";
import { ParticipateDto } from "../participants/dto/participate.dto";
import { SessionsService } from "../session/session.service";
import { AttemptStatus } from "src/common/enums/attempt-status.enums";

function getClientIp(req: Request) {
  const xfwd = req.headers["x-forwarded-for"];
  if (typeof xfwd === "string" && xfwd.length > 0) {
    return xfwd.split(",")[0].trim();
  }
  return req.ip ?? null;
}

@Controller("/public")
export class PublicController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly participantsService: ParticipantsService,
    private readonly attemptsService: AttemptsService,
  ) { }

  /**
   * Participate flow:
   * - upsert participant (username/email/phone)
   * - require an active session
   * - if already submitted in this session => alreadyParticipated=true
   * - else create/resume the attempt and return attempt info
   */
  @Post("participate")
  async participate(@Body() dto: ParticipateDto, @Req() req: Request) {
    const activeSession = await this.sessionsService.getActiveSession();
    if (!activeSession) {
      throw new ConflictException("No active session right now.");
    }
    const participant = await this.participantsService.upsertByEmail(dto);

    const meta = {
      ip: getClientIp(req) ?? undefined,
      userAgent: (req.headers["user-agent"] as string | undefined) ?? undefined,
    };

    let attempt: any;
    try {
      attempt = await this.attemptsService.createAttemptIfNotExists(
        String(participant._id),
        String(activeSession._id),
        meta,
      );
    } catch (e: any) {
      // If user double-clicks participate fast, unique index may throw duplicate key
      if (e?.code === 11000) {
        attempt = await this.attemptsService.findByParticipantAndSession(
          String(participant._id),
          String(activeSession._id),
        );
      } else {
        throw e;
      }
    }

    if (!attempt) {
      throw new ConflictException("Could not create/resume attempt.");
    }

    const alreadyParticipated = attempt.status === AttemptStatus.SUBMITTED;

    const publicQuestions = (attempt.questions ?? []).map((q: any) => ({
      id: q.questionId,
      prompt: q.prompt,
      choices: q.choices,
      points: q.points ?? 1,
    }));

    return {
      session: {
        id: String(activeSession._id),
        name: activeSession.name,
        slug: activeSession.slug,
        dayNumber: activeSession.dayNumber,
      },
      participant: {
        id: String(participant._id),
        username: participant.username,
        email: participant.email,
        phone: participant.phone,
      },
      attempt: {
        id: String(attempt._id),
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        elapsedMs: attempt.elapsedMs,
        score: attempt.score,
        correctCount: attempt.correctCount,
        totalQuestions: attempt.totalQuestions,
        questionsVersion: attempt.questionsVersion,
      },
      questions: publicQuestions,
      alreadyParticipated,
    };
  }
}
