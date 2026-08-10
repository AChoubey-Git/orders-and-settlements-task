import { IsNumber, IsDateString, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-08-08' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Partial payment - first instalment' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'payment', enum: ['payment', 'refund'] })
  @IsOptional()
  @IsIn(['payment', 'refund'])
  type?: 'payment' | 'refund';
}
