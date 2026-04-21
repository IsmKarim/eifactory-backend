import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSessionDto } from './dto/createSession.dto';
import { DeclareWinnersDto } from './dto/declare-winners.dto';
import { SessionsService } from './session.service';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // ---------------------------
  // Public (user side)
  // ---------------------------

  @Get('/public/events/:eventId/session/active')
  async active(@Param('eventId') eventId: string) {
    return this.sessionsService.getActiveSession(eventId);
  }

  // ---------------------------
  // Admin (protect later)
  // TODO: add @UseGuards(AdminJwtGuard)
  // ---------------------------

  @Get('/admin/events/:eventId/sessions')
  async list(@Param('eventId') eventId: string) {
    return this.sessionsService.listSessions(eventId);
  }

  @Get('/admin/sessions/:id')
  async getOne(@Param('id') id: string) {
    return this.sessionsService.getSessionById(id);
  }

  @Post('/admin/events/:eventId/sessions/start')
  async start(@Param('eventId') eventId: string, @Body() dto: CreateSessionDto) {
    return this.sessionsService.startSession(eventId, dto);
  }

  @Post('/admin/events/:eventId/sessions/end')
  async endActive(@Param('eventId') eventId: string) {
    return this.sessionsService.endActiveSession(eventId);
  }

  @Post('/admin/sessions/:id/winners')
  async winners(@Param('id') id: string, @Body() dto: DeclareWinnersDto) {
    return this.sessionsService.declareWinners(id, dto);
  }
}
