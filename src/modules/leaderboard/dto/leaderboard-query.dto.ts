import { IsMongoId, IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class LeaderboardQueryDto {
  @IsOptional()
  @IsMongoId()
  sessionId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number; // per session
}
