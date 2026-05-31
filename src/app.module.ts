import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisModule } from "./modules/redis/redis.module";
import { CoinsModule } from "./modules/coins/coins.module";
import { CronModule } from "./modules/cron/cron.module";
import { SecurityModule } from "./modules/security/security.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { SwapModule } from "./modules/swap/swap.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { TokenModule } from "./modules/token/token.module";
import { QuestsModule } from "./modules/quests/quests.module";


@Module({
  imports: [
    // Config — global, load .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          "MONGODB_URI",
          "mongodb://localhost:27017/crypto-tracker",
        ),
      }),
      inject: [ConfigService],
    }),

    // Schedule (cron jobs)
    ScheduleModule.forRoot(),

    // Infrastructure
    RedisModule,

    // Feature modules
    AuthModule,
    CoinsModule,
    CronModule,
    SwapModule,
    AlertsModule,
    NotificationsModule,
    TokenModule,
    QuestsModule,


    // Security (rate limiting)
    SecurityModule,

    // Health check
    HealthModule,
  ],
})
export class AppModule {}
