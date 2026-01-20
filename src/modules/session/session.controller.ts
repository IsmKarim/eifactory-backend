import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateSessionDto } from "./dto/createSession.dto";
import { DeclareWinnersDto } from "./dto/declare-winners.dto";
import { SessionsService } from "./session.service";

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // ---------------------------
  // Public (user side)
  // ---------------------------

  @Get("/public/session/active")
  async active() {
    return this.sessionsService.getActiveSession();
  }

  // ---------------------------
  // Admin (protect later)
  // TODO: add @UseGuards(AdminJwtGuard)
  // ---------------------------

  @Get("/admin/sessions")
  async list() {
    return this.sessionsService.listSessions();
  }

  @Get("/admin/sessions/:id")
  async getOne(@Param("id") id: string) {
    return this.sessionsService.getSessionById(id);
  }

  @Post("/admin/sessions/start")
  async start(@Body() dto: CreateSessionDto) {
    return this.sessionsService.startSession(dto);
  }

  @Post("/admin/sessions/end")
  async endActive() {
    return this.sessionsService.endActiveSession();
  }

  @Post("/admin/sessions/:id/winners")
  async winners(@Param("id") id: string, @Body() dto: DeclareWinnersDto) {
    return this.sessionsService.declareWinners(id, dto);
  }
}
