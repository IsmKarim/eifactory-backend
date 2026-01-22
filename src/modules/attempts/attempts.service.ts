import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Attempt, AttemptDocument } from "./schemas/attempt.schema";
import { AttemptStatus } from "../../common/enums/attempt-status.enum";
import { QuestionsService } from "../questions/questions.service";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(Attempt.name)
    private readonly attemptModel: Model<AttemptDocument>,
    private readonly questionsService: QuestionsService,
  ) {}

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
  async createAttemptIfNotExists(participantId: string, sessionId: string, meta?: { ip?: string; userAgent?: string }) {
    if (!Types.ObjectId.isValid(participantId)) throw new BadRequestException("Invalid participant id.");
    if (!Types.ObjectId.isValid(sessionId)) throw new BadRequestException("Invalid session id.");

    const existing = await this.attemptModel.findOne({
      participantId: new Types.ObjectId(participantId),
      sessionId: new Types.ObjectId(sessionId),
    });

    if (existing) return existing.toObject();

    const { version, questions } = this.questionsService.getAdminQuestions();

    const created = await this.attemptModel.create({
      participantId: new Types.ObjectId(participantId),
      sessionId: new Types.ObjectId(sessionId),
      status: AttemptStatus.CREATED,
      startedAt: null,
      submittedAt: null,
      elapsedMs: null,
      answers: [],
      score: 0,
      correctCount: 0,
      totalQuestions: questions.length,
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
    if (!Types.ObjectId.isValid(attemptId)) throw new BadRequestException("Invalid attempt id.");

    const attempt = await this.attemptModel.findById(attemptId);
    if (!attempt) throw new NotFoundException("Attempt not found.");

    if (attempt.status === AttemptStatus.SUBMITTED) {
      throw new BadRequestException("Attempt already submitted.");
    }
    if (!attempt.startedAt) {
      throw new BadRequestException("Attempt has not been started.");
    }

    // Basic answer validation: unique questionIds
    const seen = new Set<string>();
    for (const a of dto.answers) {
      const qid = a.questionId.trim();
      if (seen.has(qid)) throw new BadRequestException(`Duplicate answer for questionId: ${qid}`);
      seen.add(qid);
    }

    // Score using server questions
    const { version, questions } = this.questionsService.getAdminQuestions();
    const correctById = new Map(questions.map((q) => [q.id, q.correctChoiceId]));
    const pointsById = new Map(questions.map((q) => [q.id, q.points ?? 1]));

    // Validate question IDs exist
    for (const a of dto.answers) {
      if (!correctById.has(a.questionId)) {
        throw new BadRequestException(`Unknown questionId: ${a.questionId}`);
      }
    }

    let correctCount = 0;
    let score = 0;

    for (const a of dto.answers) {
      const correctChoice = correctById.get(a.questionId)!;
      if (a.choiceId === correctChoice) {
        correctCount += 1;
        score += pointsById.get(a.questionId) ?? 1;
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
    attempt.totalQuestions = questions.length;

    attempt.questionsVersion = version;

    attempt.elapsedMs = elapsedMs;
    attempt.submittedAt = submittedAt;
    attempt.status = AttemptStatus.SUBMITTED;

    await attempt.save();

    return attempt.toObject();
  }
}
