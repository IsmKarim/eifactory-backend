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

export class UpdateQuestionDto {
  @IsOptional() @IsString() @IsNotEmpty() text?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options?: string[];

  @IsOptional() @IsInt() @Min(0) @Max(3) correctIndex?: number;
  @IsOptional() @IsNumber() @Min(0) order?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
