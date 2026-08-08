import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

      const remaining = order.total - order.amountPaid;

      if (dto.amount > remaining) {
        throw new BadRequestException(
          `Payment of ${dto.amount} exceeds remaining balance of ${remaining}`,
        );
      }

      // Insert the payment document
      const [payment] = await this.paymentModel.create(
        [
          {
            orderId: new Types.ObjectId(orderId),
            amount: dto.amount,
            date: new Date(dto.date),
            note: dto.note,
          },
        ],
        { session },
      );

      // Update the order's amountPaid and status atomically
      const newAmountPaid = order.amountPaid + dto.amount;
      const newStatus = this.ordersService.computeStatus(
        order.total,
        newAmountPaid,
        order.dueDate,
      );

      const updatedOrder = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          { $set: { amountPaid: newAmountPaid, status: newStatus } },
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
