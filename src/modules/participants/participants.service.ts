import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ParticipateDto } from "./dto/participate.dto";
import { Participant, ParticipantDocument } from "./schemas/participant.schema";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/[^\d]/g, ""); 

  const normalized = (hasPlus ? "+" : "") + digitsOnly;
  const digitCount = digitsOnly.length;
  if (digitCount < 7 || digitCount > 15) return "";
  return normalized;
}

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<ParticipantDocument>,
  ) {}

  async upsertByEmail(dto: ParticipateDto) {
    const email = normalizeEmail(dto.email);
    const username = dto.username.trim();
    const phone = normalizePhone(dto.phone);

    if (!email) throw new BadRequestException("Email is required.");
    if (!username) throw new BadRequestException("Username is required.");
    if (!phone) throw new BadRequestException("Phone number is invalid.");

    const now = new Date();

    const participant = await this.participantModel
      .findOneAndUpdate(
        { email },
        {
          $set: { username, phone, lastSeenAt: now },
          $setOnInsert: { email },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();

    return participant;
  }

  async findByEmail(email: string) {
    const normalized = normalizeEmail(email);
    return this.participantModel.findOne({ email: normalized }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid participant id.");
    const participant = await this.participantModel.findById(id).lean();
    if (!participant) throw new NotFoundException("Participant not found.");
    return participant;
  }

  async list({ limit = 50, skip = 0 }: { limit?: number; skip?: number } = {}) {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeSkip = Math.max(skip, 0);

    const [items, total] = await Promise.all([
      this.participantModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      this.participantModel.countDocuments(),
    ]);

    return { total, items, limit: safeLimit, skip: safeSkip };
  }
}
