import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PriceAlert, PriceAlertDocument } from "./schemas/price-alert.schema";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(PriceAlert.name)
    private readonly alertModel: Model<PriceAlertDocument>,
  ) {}

  async create(userId: string, dto: CreatePriceAlertDto): Promise<PriceAlert> {
    const alert = new this.alertModel({
      userId,
      symbol: dto.symbol.toUpperCase(),
      targetPrice: dto.targetPrice,
      condition: dto.condition,
      isTriggered: false,
    });
    return alert.save();
  }

  async findAll(userId: string): Promise<PriceAlert[]> {
    return this.alertModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const result = await this.alertModel.findOneAndDelete({ _id: id, userId }).exec();
    if (!result) {
      throw new NotFoundException("Cảnh báo giá không tồn tại hoặc bạn không có quyền xóa");
    }
    return { success: true };
  }

  async findActiveAlerts(): Promise<PriceAlertDocument[]> {
    return this.alertModel.find({ isTriggered: false }).exec();
  }

  async markAsTriggered(id: string): Promise<void> {
    await this.alertModel.updateOne({ _id: id }, { $set: { isTriggered: true } }).exec();
  }
}
