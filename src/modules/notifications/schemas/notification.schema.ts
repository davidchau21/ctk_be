import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  collection: "notifications",
  timestamps: true,
  versionKey: false,
})
export class Notification {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true, enum: ["alert", "swap", "system"], default: "system" })
  type: "alert" | "swap" | "system";

  @Prop({ type: Boolean, default: false, index: true })
  isRead: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
