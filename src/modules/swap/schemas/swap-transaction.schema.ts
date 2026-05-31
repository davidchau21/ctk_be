import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SwapTransactionDocument = HydratedDocument<SwapTransaction>;

@Schema({
  collection: "swap_transactions",
  timestamps: true,
  versionKey: false,
})
export class SwapTransaction {
  @Prop({ type: String, required: true, index: true, lowercase: true })
  address: string;

  @Prop({ type: String, required: true })
  fromToken: string;

  @Prop({ type: String, required: true })
  toToken: string;

  @Prop({ type: String, required: true })
  fromAmount: string;

  @Prop({ type: String, required: true })
  toAmount: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  hash: string;

  createdAt: Date;
  updatedAt: Date;
}

export const SwapTransactionSchema = SchemaFactory.createForClass(SwapTransaction);
