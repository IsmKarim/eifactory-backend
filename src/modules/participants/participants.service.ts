import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventsService } from '../events/events.service';
import { Participant, ParticipantDocument } from './schemas/participant.schema';
import { ParticipateDto, RegisterParticipantDto } from './dto/participate.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<ParticipantDocument>,
    private readonly eventsService: EventsService,
  ) {}

  // ── Public: self-registration (event-scoped) ─────────────────────────────────

  async register(eventId: string, dto: RegisterParticipantDto): Promise<ParticipantDocument> {
    const event = await this.eventsService.findById(eventId);
    if (event.status !== 'active') {
      throw new ConflictException('Registration is not open for this event');
    }

    const existing = await this.participantModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (existing) {
      throw new ConflictException('This email is already registered');
    }

    return this.participantModel.create({
      username: dto.username,
      companyName: dto.companyName ?? '',
      email: dto.email.toLowerCase(),
      phone: dto.phone,
    });
  }

  // ── Public: upsert by email (used by /public/participate) ────────────────────

  async upsertByEmail(dto: ParticipateDto): Promise<ParticipantDocument> {
    const email = dto.email.toLowerCase();
    const participant = await this.participantModel.findOneAndUpdate(
      { email },
      {
        $set: {
          username: dto.username,
          companyName: dto.companyName ?? '',
          phone: dto.phone,
          lastSeenAt: new Date(),
        },
        $setOnInsert: { email },
      },
      { upsert: true, new: true },
    );
    return participant!;
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  async findByEmailAndEvent(email: string, _eventId: string): Promise<ParticipantDocument> {
    const participant = await this.participantModel.findOne({
      email: email.toLowerCase(),
    });
    if (!participant) {
      throw new NotFoundException('Participant not found — please register first');
    }
    return participant;
  }

  async findById(participantId: string): Promise<ParticipantDocument> {
    const participant = await this.participantModel.findById(participantId);
    if (!participant) throw new NotFoundException('Participant not found');
    return participant;
  }

  async addWonSession(participantId: string, sessionId: string): Promise<void> {
    await this.participantModel.findByIdAndUpdate(participantId, {
      $addToSet: { wonSessionIds: new Types.ObjectId(sessionId) },
    });
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async findAllByEvent(eventId: string): Promise<ParticipantDocument[]> {
    await this.eventsService.findById(eventId);
    return this.participantModel.find().sort({ createdAt: -1 });
  }

  async countByEvent(eventId: string): Promise<number> {
    await this.eventsService.findById(eventId);
    return this.participantModel.countDocuments();
  }

  async hasWonInEvent(_participantId: string, _eventId: string): Promise<boolean> {
    return false;
  }
}
