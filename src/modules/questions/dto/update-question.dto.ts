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
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'What is the boiling point of water?' })
  @IsOptional() @IsString() @IsNotEmpty() text?: string;

  @ApiPropertyOptional({ example: ['90°C', '100°C', '110°C', '120°C'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 3 })
  @IsOptional() @IsInt() @Min(0) @Max(3) correctIndex?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional() @IsNumber() @Min(0) order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() isActive?: boolean;
}
