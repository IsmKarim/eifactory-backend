import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventDto } from './dto/createEvent.dto';
import { Event, EventDocument } from './event.schema';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async create(dto: CreateEventDto): Promise<EventDocument> {
    const exists = await this.eventModel.findOne({ slug: dto.slug });
    if (exists) {
      throw new ConflictException(`Event with slug "${dto.slug}" already exists`);
    }
    return this.eventModel.create(dto);
  }

  async findAll(): Promise<EventDocument[]> {
    return this.eventModel.find().sort({ startDate: -1 });
  }

  async findBySlug(slug: string): Promise<EventDocument> {
    const event = await this.eventModel.findOne({ slug });
    if (!event) throw new NotFoundException(`Event "${slug}" not found`);
    return event;
  }

  async findById(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException(`Event not found`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventDocument> {
    if (dto.slug) {
      const conflict = await this.eventModel.findOne({
        slug: dto.slug,
        _id: { $ne: id },
      });
      if (conflict) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }

    const updated = await this.eventModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException(`Event not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Event not found`);
  }

  async linkProduct(eventId: string, productId: string): Promise<EventDocument> {
    await this.productsService.findById(productId);
    const event = await this.eventModel.findByIdAndUpdate(
      eventId,
      { $addToSet: { productIds: new Types.ObjectId(productId) } },
      { new: true },
    );
    if (!event) throw new NotFoundException(`Event not found`);
    return event;
  }

  async unlinkProduct(eventId: string, productId: string): Promise<EventDocument> {
    const event = await this.eventModel.findByIdAndUpdate(
      eventId,
      { $pull: { productIds: new Types.ObjectId(productId) } },
      { new: true },
    );
    if (!event) throw new NotFoundException(`Event not found`);
    return event;
  }

  async getProducts(eventId: string) {
    const event = await this.findById(eventId);
    return this.productsService.findByIds(event.productIds);
  }
}