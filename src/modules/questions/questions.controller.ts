import { Controller, Get } from "@nestjs/common";
import { QuestionsService } from "./questions.service";

@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // Public endpoint for the quiz client
  @Get("/public/questions")
  getPublicQuestions() {
    return this.questionsService.getPublicQuestions();
  }

  // Admin endpoint (later protect with AdminJwtGuard)
  // TODO: @UseGuards(AdminJwtGuard)
  @Get("/admin/questions")
  getAdminQuestions() {
    return this.questionsService.getAdminQuestions();
  }
}
