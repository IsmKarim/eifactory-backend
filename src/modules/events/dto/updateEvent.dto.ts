import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { EventStatus } from '../event.schema';

class UpdateLandingDto {
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() slogan?: string;
  @IsOptional() @IsString() prizeDescription?: string;
  @IsOptional() @IsUrl() prizeImageUrl?: string;
}

class UpdateQuizConfigDto {
  @IsOptional() @IsInt() @Min(1) questionCount?: number;
}

class UpdateBrandingDto {
  @IsOptional() @IsUrl() logoUrl?: string;
  @IsOptional() @IsHexColor() primaryColor?: string;
  @IsOptional() @IsString() organizerName?: string;
}

class UpdateProductDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsUrl() photoUrl?: string;
  @IsOptional() @IsUrl() link?: string;
}

export class UpdateEventDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers and hyphens only',
  })
  slug?: string;

  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;

  @IsOptional() @ValidateNested() @Type(() => UpdateLandingDto) landing?: UpdateLandingDto;
  @IsOptional() @ValidateNested() @Type(() => UpdateQuizConfigDto) quiz?: UpdateQuizConfigDto;
  @IsOptional() @ValidateNested() @Type(() => UpdateBrandingDto) branding?: UpdateBrandingDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductDto)
  products?: UpdateProductDto[];
}
