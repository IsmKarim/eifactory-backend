import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParticipantsService } from './participants.service';
import { RegisterParticipantDto } from './dto/participate.dto';

@Controller('events/:eventId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  // ── Public: self-registration ────────────────────────────────────────────────

  @Post('register')
  register(
    @Param('eventId') eventId: string,
    @Body() dto: RegisterParticipantDto,
  ) {
    return this.participantsService.register(eventId, dto);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  findAll(@Param('eventId') eventId: string) {
    return this.participantsService.findAllByEvent(eventId);
  }

  @Get('count')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  count(@Param('eventId') eventId: string) {
    return this.participantsService.countByEvent(eventId);
  }
}