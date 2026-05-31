import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SwapTransaction, SwapTransactionDocument } from "./schemas/swap-transaction.schema";
import { CoinsService } from "../coins/coins.service";
import { CreateSwapDto } from "./dto/create-swap.dto";

@Injectable()
export class SwapService {
  constructor(
    @InjectModel(SwapTransaction.name)
    private readonly swapModel: Model<SwapTransactionDocument>,
    private readonly coinsService: CoinsService,
  ) {}

  async getExchangeRate(
    from: string,
    to: string,
  ): Promise<{ rate: number; fromPrice: number; toPrice: number }> {
    // 1. Fetch cached coins from Redis via CoinsService
    const result = await this.coinsService.getLatestCoins();
    const coins = result?.data ?? [];

    // 2. Helper to fetch USD price of from/to tokens
    const getPrice = (symbol: string): number => {
      const sym = symbol.toLowerCase();
      if (sym === "usdt" || sym === "usdc") return 1.0;
      const coin = coins.find(
        (c: any) => c && c.symbol && c.symbol.toLowerCase() === sym,
      ) as any;
      return coin ? Number(coin.current_price) : 0;
    };

    const fromPrice = getPrice(from) || this.getFallbackPrice(from);
    const toPrice = getPrice(to) || this.getFallbackPrice(to);

    if (!fromPrice || !toPrice) {
      throw new NotFoundException(
        `Live exchange rate not available for pair ${from}/${to}`,
      );
    }

    return {
      rate: fromPrice / toPrice,
      fromPrice,
      toPrice,
    };
  }

  private getFallbackPrice(symbol: string): number {
    const sym = symbol.toUpperCase();
    if (sym === "ETH") return 3500;
    if (sym === "BTC") return 65000;
    if (sym === "BNB") return 580;
    if (sym === "SOL") return 150;
    return 0;
  }

  async createSwap(dto: CreateSwapDto): Promise<SwapTransaction> {
    const newTx = new this.swapModel({
      ...dto,
      address: dto.address.toLowerCase(),
    });
    return newTx.save();
  }

  async getHistory(address: string): Promise<SwapTransaction[]> {
    return this.swapModel
      .find({ address: address.toLowerCase() })
      .sort({ createdAt: -1 })
      .exec();
  }
}
