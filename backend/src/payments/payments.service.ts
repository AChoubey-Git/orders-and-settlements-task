import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly ordersService: OrdersService,
  ) {}

  async createPayment(
    userId: string,
    orderId: string,
    dto: CreatePaymentDto,
  ): Promise<{ payment: PaymentDocument; order: OrderDocument }> {
    // Use MongoDB ACID transaction to prevent race conditions / over-payment
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Lock the order document within the transaction
      const order = await this.orderModel
        .findOne({ _id: orderId, userId })
        .session(session)
        .exec();

      if (!order) {
        throw new NotFoundException('Order not found');
      }



      const isRefund = dto.type === 'refund';
      const remaining = order.total - order.amountPaid;

      if (!isRefund && dto.amount > remaining) {
        throw new UnprocessableEntityException({
          error: 'PAYMENT_REJECTED',
          message: `Payment amount of $${dto.amount.toFixed(2)} exceeds the maximum remaining balance of $${remaining.toFixed(2)}`,
          meta: {
            order_total: order.total,
            current_paid: order.amountPaid,
            maximum_allowed: remaining,
          },
        });
      }

      if (isRefund && dto.amount > order.amountPaid) {
        throw new UnprocessableEntityException({
          error: 'REFUND_REJECTED',
          message: `Refund amount of $${dto.amount.toFixed(2)} exceeds the currently paid amount of $${order.amountPaid.toFixed(2)}`,
        });
      }

      // Insert the payment/refund document
      const [payment] = await this.paymentModel.create(
        [
          {
            orderId: new Types.ObjectId(orderId),
            amount: dto.amount,
            date: new Date(dto.date),
            note: dto.note,
            type: dto.type || 'payment',
          },
        ],
        { session },
      );

      // Update the order's amountPaid and status atomically
      const newAmountPaid = isRefund ? order.amountPaid - dto.amount : order.amountPaid + dto.amount;
      const newStatus = this.ordersService.computeStatus(
        order.total,
        newAmountPaid,
        order.dueDate,
      );

      const statusHistoryUpdate = newStatus !== order.status
        ? { $push: { statusHistory: { status: newStatus, timestamp: new Date() } } }
        : {};

      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          {
            $set: {
              amountPaid: newAmountPaid,
              status: newStatus,
              isEditable: false, // Remains locked even if refunded completely
            },
            ...statusHistoryUpdate,
          },
          { new: true, session },
        )
        .exec();

      await session.commitTransaction();
      return { payment, order: updatedOrder! };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async findByOrder(userId: string, orderId: string): Promise<PaymentDocument[]> {
    // Verify ownership
    const order = await this.orderModel.findOne({ _id: orderId, userId }).exec();
    if (!order) throw new NotFoundException('Order not found');
    return this.paymentModel
      .find({ orderId: new Types.ObjectId(orderId) })
      .sort({ date: -1 })
      .exec();
  }
}
