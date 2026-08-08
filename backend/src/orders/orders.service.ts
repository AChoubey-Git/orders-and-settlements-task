import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const subtotal = dto.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const order = new this.orderModel({
      userId,
      customerName: dto.customerName,
      dueDate: new Date(dto.dueDate),
      lineItems: dto.lineItems,
      subtotal,
      total: subtotal,
      amountPaid: 0,
      status: OrderStatus.PENDING,
    });
    return order.save();
  }

  async findAll(userId: string, status?: string): Promise<OrderDocument[]> {
    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    return this.orderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({ _id: orderId, userId }).exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  computeStatus(total: number, amountPaid: number, dueDate: Date): OrderStatus {
    if (amountPaid >= total) return OrderStatus.PAID;
    if (amountPaid > 0) return OrderStatus.PARTIALLY_PAID;
    if (new Date() > dueDate) return OrderStatus.OVERDUE;
    return OrderStatus.PENDING;
  }
}
