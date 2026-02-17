import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContractServiceItemDto {
  @ApiProperty()
  @IsString()
  serviceId: string;

  @ApiProperty()
  @IsInt()
  unitPrice: number;
}

export class CreateContractDto {
  @ApiProperty()
  @IsString()
  childId: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ minimum: 1, maximum: 28 })
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  punctualityDiscount?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  siblingDiscount?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  siblingCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ContractServiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractServiceItemDto)
  services: ContractServiceItemDto[];
}
