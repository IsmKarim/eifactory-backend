import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventsService } from '../events/events.service';
import {
  Participant,
  ParticipantDocument,
} from './schemas/participant.schema';
import { RegisterParticipantDto } from './dto/participate.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<ParticipantDocument>,
    private readonly eventsService: EventsService,
  ) {}

  // ── Public: self-registration ────────────────────────────────────────────────

  async register(
    eventId: string,
    dto: RegisterParticipantDto,
  ): Promise<ParticipantDocument> {
    // Ensure event exists and is active
    const event = await this.eventsService.findById(eventId);
    if (event.status !== 'active') {
      throw new ConflictException('Registration is not open for this event');
    }

    const existing = await this.participantModel.findOne({
      eventId: new Types.ObjectId(eventId),
      email: dto.email.toLowerCase(),
    });

    if (existing) {
      throw new ConflictException(
        'This email is already registered for this event',
      );
    }

    return this.participantModel.create({
      ...dto,
      eventId: new Types.ObjectId(eventId),
    });
  }

  // ── Internal: look up a participant by email for attempt validation ──────────

  async findByEmailAndEvent(
    email: string,
    eventId: string,
  ): Promise<ParticipantDocument> {
    const participant = await this.participantModel.findOne({
      email: email.toLowerCase(),
      eventId: new Types.ObjectId(eventId),
    });
    if (!participant) {
      throw new NotFoundException(
        'Participant not found — please register first',
      );
    }
    return participant;
  }

  async findById(participantId: string): Promise<ParticipantDocument> {
    const participant = await this.participantModel.findById(participantId);
    if (!participant) throw new NotFoundException('Participant not found');
    return participant;
  }

  // ── Internal: mark a session win on the participant (called by WinnersService)

  async addWonSession(
    participantId: string,
    sessionId: string,
  ): Promise<void> {
    await this.participantModel.findByIdAndUpdate(participantId, {
      $addToSet: { wonSessionIds: new Types.ObjectId(sessionId) },
    });
  }

  // ── Admin: list all participants for an event ────────────────────────────────

  async findAllByEvent(eventId: string): Promise<ParticipantDocument[]> {
    await this.eventsService.findById(eventId);
    return this.participantModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .sort({ createdAt: -1 });
  }

  async countByEvent(eventId: string): Promise<number> {
    return this.participantModel.countDocuments({
      eventId: new Types.ObjectId(eventId),
    });
  }

  // ── Internal: check if participant has won a previous session in this event ──

  async hasWonInEvent(
    participantId: string,
    eventId: string,
  ): Promise<boolean> {
    const participant = await this.participantModel.findOne({
      _id: new Types.ObjectId(participantId),
      eventId: new Types.ObjectId(eventId),
      wonSessionIds: { $exists: true, $not: { $size: 0 } },
    });
    return !!participant;
  }
}