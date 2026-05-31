import { Module } from "@nestjs/common";
import { CronService } from "./cron.service";
import { CoinsModule } from "../coins/coins.module";
import { AlertsModule } from "../alerts/alerts.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [CoinsModule, AlertsModule, NotificationsModule],
  providers: [CronService],
})
export class CronModule {}
