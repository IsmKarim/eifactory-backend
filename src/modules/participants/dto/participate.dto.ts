import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ParticipateDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  username!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  // Keep it light: accept +, digits, spaces, hyphens, parentheses
  // We'll normalize it in the service.
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, {
    message: "Invalid phone format.",
  })
  phone!: string;
}