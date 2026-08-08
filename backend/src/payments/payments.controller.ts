import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders/:orderId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a payment for an order' })
  create(
    @CurrentUser() user: { userId: string },
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(user.userId, orderId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get payment history for an order' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.findByOrder(user.userId, orderId);
  }
}
