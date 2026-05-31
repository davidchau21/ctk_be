import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { RedisService } from "../redis/redis.service";
import { CoinOrder, VsCurrency } from "../../common/enums/coin.enum";

// CoinGecko free tier: tối đa 250/request, ~30 req/phút
const PER_PAGE = 250;
const TOTAL_PAGES = 4; // 4 × 250 = 1000 coins
const REQUEST_DELAY_MS = 1_200; // 1.2s giữa các trang → ~3.6s tổng

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

@Injectable()
export class CoinsService {
  private readonly logger = new Logger(CoinsService.name);
  private readonly redisKey = "coins:latest";
  private readonly lastUpdateKey = "coins:lastUpdate";

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async fetchAndStoreTopCoins(): Promise<void> {
    const baseUrl = this.config.get<string>(
      "COINGECKO_BASE_URL",
      "https://api.coingecko.com/api/v3",
    );
    const url = `${baseUrl}/coins/markets`;

    this.logger.log(
      `Fetching top ${PER_PAGE * TOTAL_PAGES} coins from CoinGecko (${TOTAL_PAGES} pages)...`,
    );

    const allCoins: unknown[] = [];

    for (let page = 1; page <= TOTAL_PAGES; page++) {
      try {
        const { data } = await axios.get<unknown[]>(url, {
          params: {
            vs_currency: VsCurrency.USD,
            order: CoinOrder.MARKET_CAP_DESC,
            per_page: PER_PAGE,
            page,
            sparkline: false,
          },
          timeout: 15_000,
        });

        allCoins.push(...data);
        this.logger.log(
          `  Page ${page}/${TOTAL_PAGES}: fetched ${data.length} coins (total: ${allCoins.length})`,
        );

        // Delay giữa các request để không bị rate limit
        if (page < TOTAL_PAGES) {
          await sleep(REQUEST_DELAY_MS);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`  Page ${page} failed: ${msg}`);
        // Nếu trang đầu lỗi thì throw, còn lại thì dừng sớm nhưng vẫn lưu những gì đã có
        if (page === 1) throw err;
        break;
      }
    }

    if (allCoins.length === 0) {
      this.logger.warn("No coins fetched, skipping Redis update");
      return;
    }

    await this.redis.set(this.redisKey, JSON.stringify(allCoins));
    await this.redis.set(this.lastUpdateKey, new Date().toISOString());
    this.logger.log(`✅ Stored ${allCoins.length} coins in Redis`);
  }

  async getLatestCoins(
    page?: number,
    limit?: number,
  ): Promise<{ data: unknown[]; count: number }> {
    const raw = await this.redis.get(this.redisKey);
    if (!raw) return { data: [], count: 0 };

    const coins = JSON.parse(raw) as unknown[];
    const count = coins.length;

    if (page !== undefined && limit !== undefined) {
      const start = (page - 1) * limit;
      const end = start + limit;
      return { data: coins.slice(start, end), count };
    }

    return { data: coins, count };
  }

  async getLastUpdate(): Promise<string | null> {
    return this.redis.get(this.lastUpdateKey);
  }
}
