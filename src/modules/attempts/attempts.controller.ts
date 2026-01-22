import { Body, Controller, Param, Post } from "@nestjs/common";
import { AttemptsService } from "./attempts.service";
import { SubmitAttemptDto } from "./dto/submt-attempt.dto";

@Controller("/public/attempts")
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post(":id/start")
  start(@Param("id") id: string) {
    return this.attemptsService.startAttempt(id);
  }

  @Post(":id/submit")
  submit(@Param("id") id: string, @Body() dto: SubmitAttemptDto) {
    return this.attemptsService.submitAttempt(id, dto);
  }
}
