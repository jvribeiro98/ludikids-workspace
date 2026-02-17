import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  attachmentPath?: string;
}
