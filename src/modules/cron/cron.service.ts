import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { CoinsService } from "../coins/coins.service";
import { AlertsService } from "../alerts/alerts.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly coinsService: CoinsService,
    private readonly config: ConfigService,
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron("*/5 * * * *", { name: "coins-update" })
  async handleCoinUpdate(): Promise<void> {
    const cron = this.config.get<string>("UPDATE_CRON", "*/5 * * * *");
    this.logger.log(`[${cron}] Running scheduled coin update`);
    try {
      await this.coinsService.fetchAndStoreTopCoins();
      this.logger.log("Scheduled coin update completed");

      // Quét các cảnh báo giá sau khi đã cập nhật giá mới thành công
      await this.checkPriceAlerts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Scheduled coin update failed: ${message}`);
    }
  }

  async checkPriceAlerts(): Promise<void> {
    this.logger.log("Checking active price alerts...");
    try {
      const activeAlerts = await this.alertsService.findActiveAlerts();
      if (activeAlerts.length === 0) {
        this.logger.log("No active price alerts to check");
        return;
      }

      const result = await this.coinsService.getLatestCoins();
      const coins = result?.data ?? [];
      if (coins.length === 0) {
        this.logger.warn("No coin data available in Redis to compare alerts");
        return;
      }

      let triggeredCount = 0;
      for (const alert of activeAlerts) {
        const sym = alert.symbol.toLowerCase();
        const coin = coins.find(
          (c: any) => c && c.symbol && c.symbol.toLowerCase() === sym,
        ) as any;
        if (!coin) continue;

        const currentPrice = Number(coin.current_price);
        if (isNaN(currentPrice)) continue;

        let shouldTrigger = false;
        if (alert.condition === "above" && currentPrice >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.condition === "below" && currentPrice <= alert.targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          this.logger.log(
            `Price alert triggered for user ${alert.userId}: ${alert.symbol} is ${currentPrice} USD (target: ${alert.targetPrice} USD, condition: ${alert.condition})`,
          );

          // Đánh dấu là đã khớp/kích hoạt
          await this.alertsService.markAsTriggered(alert._id.toString());

          // Tạo thông báo mới cho user
          const title = `🔔 Cảnh báo giá: ${alert.symbol}`;
          const message = `Giá của ${alert.symbol} đã ${
            alert.condition === "above" ? "vượt trên" : "giảm dưới"
          } $${alert.targetPrice.toLocaleString()} (Giá hiện tại: $${currentPrice.toLocaleString()})`;

          await this.notificationsService.create(alert.userId, title, message, "alert");
          triggeredCount++;
        }
      }
      this.logger.log(`Checked active alerts. Triggered ${triggeredCount} alerts`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error checking price alerts: ${msg}`);
    }
  }
}
