import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Notification, NotificationDocument } from "./schemas/notification.schema";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: "alert" | "swap" | "system",
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId,
      title,
      message,
      type,
      isRead: false,
    });
    return notification.save();
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; modifiedCount: number }> {
    const result = await this.notificationModel
      .updateMany({ userId, isRead: false }, { $set: { isRead: true } })
      .exec();
    return { success: true, modifiedCount: result.modifiedCount };
  }
}
