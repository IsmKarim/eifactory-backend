import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('events/:eventId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // ── Admin routes ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(AdminJwtGuard)
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(eventId, dto);
  }

  @Post('bulk')
  @UseGuards(AdminJwtGuard)
  bulkCreate(
    @Param('eventId') eventId: string,
    @Body() dtos: CreateQuestionDto[],
  ) {
    return this.questionsService.bulkCreate(eventId, dtos);
  }

  @Patch(':questionId')
  @UseGuards(AdminJwtGuard)
  update(
    @Param('eventId') eventId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(eventId, questionId, dto);
  }

  @Delete(':questionId')
  @UseGuards(AdminJwtGuard)
  remove(
    @Param('eventId') eventId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.questionsService.remove(eventId, questionId);
  }

  // ── Admin: full list with answers (for management view) ──────────────────────

  @Get()
  @UseGuards(AdminJwtGuard)
  findAll(@Param('eventId') eventId: string) {
    return this.questionsService.findAllByEvent(eventId);
  }
}