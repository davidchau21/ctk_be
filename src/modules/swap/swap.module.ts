import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SwapController } from "./swap.controller";
import { SwapService } from "./swap.service";
import { SwapTransaction, SwapTransactionSchema } from "./schemas/swap-transaction.schema";
import { CoinsModule } from "../coins/coins.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SwapTransaction.name, schema: SwapTransactionSchema },
    ]),
    CoinsModule,
  ],
  controllers: [SwapController],
  providers: [SwapService],
  exports: [SwapService],
})
export class SwapModule {}
