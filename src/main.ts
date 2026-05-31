import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix("api/v1");

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── Global exception filter ──────────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Global response transform ────────────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors();

  // ── Swagger ─────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle("CryptoTracker API")
    .setDescription(
      "Real-time cryptocurrency tracking API. " +
        "Fetches top 50 coins by market cap from CoinGecko every 5 minutes and caches them in Redis.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth", "Đăng ký, đăng nhập, đổi mật khẩu, quên mật khẩu")
    .addTag("Coins", "Coin data endpoints — fetch, cache & status")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: { theme: "monokai" },
    },
    customSiteTitle: "CryptoTracker API Docs",
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); }
      .swagger-ui .info .title { color: #f7931a; }
    `,
  });

  // ── Start ────────────────────────────────────────────────────────────────────
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);

  Logger.log(`==================================================`, "Bootstrap");
  Logger.log(
    `🚀 Server is running on : http://localhost:${port}/api/v1`,
    "Bootstrap",
  );
  Logger.log(
    `📖 Swagger UI is available at: http://localhost:${port}/docs`,
    "Bootstrap",
  );
  Logger.log(`==================================================`, "Bootstrap");
}

bootstrap();
