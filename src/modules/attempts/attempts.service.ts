import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Attempt, AttemptDocument } from "./schemas/attempt.schema";
import { QuestionsService } from "../questions/questions.service";
import { AttemptStatus } from "src/common/enums/attempt-status.enums";
import { SubmitAttemptDto } from "./dto/submt-attempt.dto";


function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  // Fisher-Yates shuffle
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name)
    private readonly attemptModel: Model<AttemptDocument>,
    private readonly questionsService: QuestionsService,
  ) { }




  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid attempt id.");
    const attempt = await this.attemptModel.findById(id).lean();
    if (!attempt) throw new NotFoundException("Attempt not found.");
    return attempt;
  }

  async findByParticipantAndSession(participantId: string, sessionId: string) {
    if (!Types.ObjectId.isValid(participantId)) throw new BadRequestException("Invalid participant id.");
    if (!Types.ObjectId.isValid(sessionId)) throw new BadRequestException("Invalid session id.");

    return this.attemptModel.findOne({
      participantId: new Types.ObjectId(participantId),
      sessionId: new Types.ObjectId(sessionId),
    }).lean();
  }

  /**
   * Used by Participate flow:
   * - If attempt exists and SUBMITTED => caller should block
   * - If attempt exists and not submitted => resume it
   * - Else create it
   */
  async createAttemptIfNotExists(
    participantId: string,
    sessionId: string,
    meta?: { ip?: string; userAgent?: string }
  ) {
    if (!Types.ObjectId.isValid(participantId)) throw new BadRequestException("Invalid participant id.");
    if (!Types.ObjectId.isValid(sessionId)) throw new BadRequestException("Invalid session id.");

    const existing = await this.attemptModel.findOne({
      participantId: new Types.ObjectId(participantId),
      sessionId: new Types.ObjectId(sessionId),
    });

    const { version, questions } = this.questionsService.getAdminQuestions();
    if (questions.length < 3) throw new BadRequestException("Not enough questions configured.");

    // If exists: ensure it has questions (migration-safe)
    if (existing) {
      if (!existing.questions || existing.questions.length === 0) {
        const picked = pickRandom(questions, 3);
        existing.questions = picked.map((q) => ({
          questionId: q.id,
          prompt: q.prompt,
          choices: shuffle(q.choices),
          correctChoiceId: q.correctChoiceId,
          points: q.points ?? 1,
        })) as any;

        existing.totalQuestions = existing.questions.length;
        existing.questionsVersion = version;
        await existing.save();
      }
      return existing.toObject();
    }

    const picked = pickRandom(questions, 3);

    const created = await this.attemptModel.create({
      participantId: new Types.ObjectId(participantId),
      sessionId: new Types.ObjectId(sessionId),
      status: AttemptStatus.CREATED,
      startedAt: null,
      submittedAt: null,
      elapsedMs: null,
      questions: picked.map((q) => ({
        questionId: q.id,
        prompt: q.prompt,
        choices: shuffle(q.choices),
        correctChoiceId: q.correctChoiceId,
        points: q.points ?? 1,
      })),
      answers: [],
      score: 0,
      correctCount: 0,
      totalQuestions: 3,
      questionsVersion: version,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
    });

    return created.toObject();
  }


  async startAttempt(attemptId: string) {
    if (!Types.ObjectId.isValid(attemptId)) throw new BadRequestException("Invalid attempt id.");

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException("Attempt not found.");

    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new BadRequestException("Attempt already submitted.");
    }

    // idempotent: starting again returns same startedAt
    if (!attempt.startedAt) {
      attempt.startedAt = new Date();
    }
    attempt.status = AttemptStatus.STARTED;

    await attempt.save();
    return attempt.toObject();
  }

  async submitAttempt(attemptId: string, dto: SubmitAttemptDto) {
    if (!Types.ObjectId.isValid(attemptId)) {
      throw new BadRequestException("Invalid attempt id.");
    }

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException("Attempt not found.");

    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new BadRequestException("Attempt already submitted.");
    }
    if (!attempt.startedAt) {
      throw new BadRequestException("Attempt has not been started.");
    }

    if (!attempt.questions || attempt.questions.length === 0) {
      throw new BadRequestException("Attempt has no questions assigned.");
    }

    // Allowed questions are ONLY the 3 assigned to this attempt
    const allowed = new Map<string, any>(
      attempt.questions.map((q: any) => [q.questionId, q]),
    );

    // Basic answer validation: unique questionIds + only allowed questions
    const seen = new Set<string>();
    for (const a of dto.answers) {
      const qid = a.questionId.trim();
      if (seen.has(qid)) {
        throw new BadRequestException(`Duplicate answer for questionId: ${qid}`);
      }
      seen.add(qid);

      if (!allowed.has(qid)) {
        throw new BadRequestException(`Question not part of this attempt: ${qid}`);
      }
    }

    // Strict mode: must answer ALL assigned questions (recommended)
    if (dto.answers.length !== attempt.questions.length) {
      throw new BadRequestException(
        `You must answer all ${attempt.questions.length} questions.`,
      );
    }

    let correctCount = 0;
    let score = 0;

    for (const a of dto.answers) {
      const q = allowed.get(a.questionId.trim())!;
      const isCorrect = a.choiceId.trim() === q.correctChoiceId;
      if (isCorrect) {
        correctCount += 1;
        score += q.points ?? 1;
      }
    }

    const submittedAt = new Date();
    const elapsedMs = Math.max(0, submittedAt.getTime() - attempt.startedAt.getTime());

    attempt.answers = dto.answers.map((a) => ({
      questionId: a.questionId.trim(),
      choiceId: a.choiceId.trim(),
    })) as any;

    attempt.correctCount = correctCount;
    attempt.score = score;
    attempt.totalQuestions = attempt.questions.length;

    // Keep attempt.questionsVersion as the one used when the attempt was created.
    // (Do NOT overwrite it with current bank version, unless you want that behavior.)
    // attempt.questionsVersion = attempt.questionsVersion;

    attempt.elapsedMs = elapsedMs;
    attempt.submittedAt = submittedAt;
    attempt.status = AttemptStatus.SUBMITTED;

    await attempt.save();
    return attempt.toObject();
  }

}
