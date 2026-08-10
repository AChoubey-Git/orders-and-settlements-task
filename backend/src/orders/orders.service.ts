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
      statusHistory: [{ status: OrderStatus.PENDING, timestamp: new Date() }],
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
    // PAID overrides everything
    if (amountPaid >= total) return OrderStatus.PAID;
    // OVERDUE: any unpaid amount past the due date (even partially paid)
    if (new Date() > new Date(dueDate)) return OrderStatus.OVERDUE;
    // PARTIALLY_PAID: some payment made but not yet due
    if (amountPaid > 0) return OrderStatus.PARTIALLY_PAID;
    // Default: no payment, not yet due
    return OrderStatus.PENDING;
  }

  async exportCsv(userId: string, startDate?: string, endDate?: string, status?: string): Promise<string> {
    const query: any = { userId };
    
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const orders = await this.orderModel.find(query).sort({ createdAt: -1 }).exec();

    const headers = ['Order ID', 'Customer Name', 'Creation Date', 'Due Date', 'Total', 'Amount Paid', 'Remaining', 'Status'];
    const rows = orders.map(order => [
      order._id.toString(),
      `"${order.customerName.replace(/"/g, '""')}"`, // Escape quotes
      (order.createdAt as Date).toISOString().split('T')[0],
      new Date(order.dueDate).toISOString().split('T')[0],
      order.total.toFixed(2),
      order.amountPaid.toFixed(2),
      (order.total - order.amountPaid).toFixed(2),
      order.status,
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}
