import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SubmitAnswerDto {
  @IsString()
  @MaxLength(80)
  questionId!: string;

  @IsString()
  @MaxLength(20)
  choiceId!: string;
}

export class SubmitAttemptDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];
}
