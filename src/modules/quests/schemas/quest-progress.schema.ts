import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type QuestProgressDocument = HydratedDocument<QuestProgress>;

@Schema({
  collection: "quest_progress",
  timestamps: true,
  versionKey: false,
})
export class QuestProgress {
  @Prop({ type: Types.ObjectId, required: true, ref: "User", index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  questKey: string;

  @Prop({ type: String, required: true, enum: ["pending", "completed", "claimed"], default: "pending" })
  status: string; // "pending" | "completed" | "claimed"

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  claimedAt?: Date;

  @Prop({ type: String })
  txHash?: string; // On-chain reward transfer transaction hash

  @Prop({ type: String })
  userWalletAddress?: string; // Wallet address to which rewards were sent

  createdAt: Date;
  updatedAt: Date;
}

export const QuestProgressSchema = SchemaFactory.createForClass(QuestProgress);

// Index to quickly search by user and quest key
QuestProgressSchema.index({ userId: 1, questKey: 1 });
