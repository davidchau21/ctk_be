import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";
import { PriceAlert, PriceAlertSchema } from "./schemas/price-alert.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceAlert.name, schema: PriceAlertSchema },
    ]),
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
