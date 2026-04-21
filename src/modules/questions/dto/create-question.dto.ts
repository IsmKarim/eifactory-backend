import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the boiling point of water?' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    example: ['90°C', '100°C', '110°C', '120°C'],
    minItems: 4,
    maxItems: 4,
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];

  @ApiProperty({ example: 1, minimum: 0, maximum: 3, description: 'Index of the correct option (0–3)' })
  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, description: 'Display order within the event' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/…/question.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
