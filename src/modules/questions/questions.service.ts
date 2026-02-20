import { Injectable, NotFoundException } from "@nestjs/common";
import { QUESTIONS, QUESTIONS_VERSION } from "./questions.data";
import { Question } from "./questions.types";

type PublicQuestion = Omit<Question, "correctChoiceId">;

@Injectable()
export class QuestionsService {
  getVersion() {
    return QUESTIONS_VERSION;
  }

  getPublicQuestions(): { version: string; questions: PublicQuestion[] } {
    const questions = QUESTIONS.map(({ correctChoiceId, ...rest }) => rest);
    console.log("getPublicQuestions", { version: QUESTIONS_VERSION, questions });
    return { version: QUESTIONS_VERSION, questions };
  }

  getAdminQuestions(): { version: string; questions: Question[] } {
    return { version: QUESTIONS_VERSION, questions: QUESTIONS };
  }

  getById(id: string): Question {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q) throw new NotFoundException("Question not found");
    return q;
  }
}
