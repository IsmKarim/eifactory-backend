import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@ApiTags('Questions')
@ApiParam({ name: 'eventId', description: 'Event ID' })
@Controller('events/:eventId/questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ── Admin routes ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Create a question for an event' })
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(eventId, dto);
  }

  @Post('bulk')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Bulk-create questions for an event' })
  @ApiBody({ type: [CreateQuestionDto] })
  bulkCreate(
    @Param('eventId') eventId: string,
    @Body() dtos: CreateQuestionDto[],
  ) {
    return this.questionsService.bulkCreate(eventId, dtos);
  }

  @Patch(':questionId')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Update a question' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  update(
    @Param('eventId') eventId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(eventId, questionId, dto);
  }

  @Delete(':questionId')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Delete a question' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  remove(
    @Param('eventId') eventId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.questionsService.remove(eventId, questionId);
  }

  @Post(':questionId/image')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Upload an image for a question (max 5 MB)' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(
    @Param('eventId') eventId: string,
    @Param('questionId') questionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.upload(file, 'eifactory/questions');
    const updated = await this.questionsService.update(eventId, questionId, {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    } as any);
    return { imageUrl: updated.imageUrl, imagePublicId: updated.imagePublicId };
  }

  // ── Admin: full list with answers (for management view) ──────────────────────

  @Get()
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'List all questions for an event (admin — includes correct answers)' })
  findAll(@Param('eventId') eventId: string) {
    return this.questionsService.findAllByEvent(eventId);
  }
}