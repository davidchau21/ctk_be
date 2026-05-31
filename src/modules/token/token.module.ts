import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TokenService } from "./token.service";
import { TokenController } from "./token.controller";

@Module({
  imports: [ConfigModule],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
