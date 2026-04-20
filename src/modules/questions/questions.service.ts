import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question as QuestionDoc, QuestionDocument } from './question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QUESTIONS, QUESTIONS_VERSION } from './questions.data';
import { Question } from './questions.types';

type PublicQuestion = Omit<Question, 'correctChoiceId'>;

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(QuestionDoc.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  // ── Static-data methods (used by AttemptsService) ────────────────────────────

  getVersion() {
    return QUESTIONS_VERSION;
  }

  getPublicQuestions(): { version: string; questions: PublicQuestion[] } {
    const questions = QUESTIONS.map(({ correctChoiceId, ...rest }) => rest);
    return { version: QUESTIONS_VERSION, questions };
  }

  getAdminQuestions(): { version: string; questions: Question[] } {
    return { version: QUESTIONS_VERSION, questions: QUESTIONS };
  }

  getById(id: string): Question {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Question not found');
    return q;
  }

  // ── MongoDB methods (used by QuestionsController) ────────────────────────────

  async create(eventId: string, dto: CreateQuestionDto): Promise<QuestionDocument> {
    return this.questionModel.create({
      ...dto,
      eventId: new Types.ObjectId(eventId),
    });
  }

  async bulkCreate(eventId: string, dtos: CreateQuestionDto[]): Promise<QuestionDocument[]> {
    const docs = dtos.map((dto) => ({ ...dto, eventId: new Types.ObjectId(eventId) }));
    return this.questionModel.insertMany(docs) as unknown as QuestionDocument[];
  }

  async update(eventId: string, questionId: string, dto: UpdateQuestionDto): Promise<QuestionDocument> {
    const updated = await this.questionModel.findOneAndUpdate(
      { _id: new Types.ObjectId(questionId), eventId: new Types.ObjectId(eventId) },
      { $set: dto },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Question not found');
    return updated;
  }

  async remove(eventId: string, questionId: string): Promise<void> {
    const result = await this.questionModel.findOneAndDelete({
      _id: new Types.ObjectId(questionId),
      eventId: new Types.ObjectId(eventId),
    });
    if (!result) throw new NotFoundException('Question not found');
  }

  async findAllByEvent(eventId: string): Promise<QuestionDocument[]> {
    return this.questionModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .sort({ order: 1, createdAt: 1 })
      .lean() as unknown as QuestionDocument[];
  }

  async sampleForAttempt(eventId: string, count: number): Promise<QuestionDocument[]> {
    const active = await this.questionModel
      .find({ eventId: new Types.ObjectId(eventId), isActive: true })
      .lean() as unknown as QuestionDocument[];

    if (active.length < count) {
      throw new NotFoundException(
        `Not enough active questions. Need ${count}, found ${active.length}.`,
      );
    }

    // Fisher-Yates shuffle
    for (let i = active.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    return active.slice(0, count);
  }
}
