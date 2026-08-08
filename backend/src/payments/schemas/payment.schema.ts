import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0.01 })
  amount: number;

  @Prop({ required: true })
  date: Date;

  @Prop()
  note: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
