import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";
import { Attempt, AttemptSchema } from "./schemas/attempt.schema";
import { QuestionsModule } from "../questions/questions.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Attempt.name, schema: AttemptSchema }]),
    QuestionsModule, // for scoring
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
