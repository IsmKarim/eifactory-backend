import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './createQuestion.dto.Ts';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}