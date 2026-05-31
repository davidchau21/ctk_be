import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PriceAlertDocument = HydratedDocument<PriceAlert>;

@Schema({
  collection: "price_alerts",
  timestamps: true,
  versionKey: false,
})
export class PriceAlert {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, uppercase: true, index: true })
  symbol: string;

  @Prop({ type: Number, required: true })
  targetPrice: number;

  @Prop({ type: String, required: true, enum: ["above", "below"] })
  condition: "above" | "below";

  @Prop({ type: Boolean, default: false, index: true })
  isTriggered: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PriceAlertSchema = SchemaFactory.createForClass(PriceAlert);
