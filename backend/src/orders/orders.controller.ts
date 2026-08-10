import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(user.userId, status);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export orders as CSV' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false })
  async exportCsv(
    @CurrentUser() user: { userId: string },
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const csvString = await this.ordersService.exportCsv(user.userId, startDate, endDate, status);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="orders.csv"');
    return res.send(csvString);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  findOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(user.userId, id);
  }
}
