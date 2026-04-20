import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class ParticipateDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsPhoneNumber()
  phone!: string;
}

// Alias used by the event-scoped registration endpoint
export { ParticipateDto as RegisterParticipantDto };
