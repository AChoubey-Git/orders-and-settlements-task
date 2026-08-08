import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class LineItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;
}
export const LineItemSchema = SchemaFactory.createForClass(LineItem);

export enum OrderStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: [LineItemSchema], required: true })
  lineItems: LineItem[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true, default: 0 })
  amountPaid: number;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
