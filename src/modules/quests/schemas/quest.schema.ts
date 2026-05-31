import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type QuestDocument = HydratedDocument<Quest>;

@Schema({
  collection: "quests",
  timestamps: true,
  versionKey: false,
})
export class Quest {
  @Prop({ type: String, required: true, unique: true, index: true })
  key: string; // e.g. "daily_login", "wallet_connect", "first_swap", "referral"

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  rewardAmount: number; // CTK reward amount

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
