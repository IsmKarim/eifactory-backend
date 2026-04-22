import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateSessionDto } from './dto/createSession.dto';
import { DeclareWinnersDto } from './dto/declare-winners.dto';
import { SessionsService } from './session.service';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // ---------------------------
  // Public
  // ---------------------------

  @Get('/public/events/:eventId/session/active')
  async active(@Param('eventId') eventId: string) {
    return this.sessionsService.getActiveSession(eventId);
  }

  // ---------------------------
  // Staff (admin + host)
  // ---------------------------

  @Get('/admin/events/:eventId/sessions')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  async list(@Param('eventId') eventId: string) {
    return this.sessionsService.listSessions(eventId);
  }

  @Get('/admin/sessions/:id')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  async getOne(@Param('id') id: string) {
    return this.sessionsService.getSessionById(id);
  }

  @Post('/admin/events/:eventId/sessions/start')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  async start(@Param('eventId') eventId: string, @Body() dto: CreateSessionDto) {
    return this.sessionsService.startSession(eventId, dto);
  }

  @Post('/admin/events/:eventId/sessions/end')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  async endActive(@Param('eventId') eventId: string) {
    return this.sessionsService.endActiveSession(eventId);
  }

  @Post('/admin/sessions/:id/winners')
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOST)
  async winners(@Param('id') id: string, @Body() dto: DeclareWinnersDto) {
    return this.sessionsService.declareWinners(id, dto);
  }
}
