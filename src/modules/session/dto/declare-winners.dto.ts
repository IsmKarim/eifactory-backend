import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsMongoId } from "class-validator";

export class DeclareWinnersDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5) // stop someone from declaring the whole crowd as winners 🤡
  @IsMongoId({ each: true })
  attemptIds!: string[];
}
