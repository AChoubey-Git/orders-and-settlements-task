import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LineItemDto {
  @ApiProperty({ example: 'Web design services' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  customerName: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ type: [LineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];
}
