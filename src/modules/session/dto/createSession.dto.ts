import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  dayNumber?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
