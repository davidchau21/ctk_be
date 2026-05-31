import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
} from "@nestjs/swagger";
import { CoinsService } from "./coins.service";
import {
  CoinDto,
  CoinsListResponseDto,
  CoinsStatusResponseDto,
  UpdateTriggeredResponseDto,
  GetCoinsDto,
} from "./dto";
import {
  COINS_LIST_ENDPOINT,
  COINS_STATUS_ENDPOINT,
  COINS_TRIGGER_UPDATE_ENDPOINT,
} from "../../common/constants/endpoint.constant";

@ApiTags("Coins")
@ApiExtraModels(CoinDto)
@Controller()
export class CoinsController {
  private readonly logger = new Logger(CoinsController.name);

  constructor(private readonly coinsService: CoinsService) {}

  @Get(COINS_LIST_ENDPOINT)
  @ApiOperation({
    summary: "Get latest coins",
    description:
      "Returns coins cached in Redis with optional server-side pagination.",
  })
  @ApiResponse({
    status: 200,
    description: "List of coins",
    type: CoinsListResponseDto,
  })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async getCoins(@Query() query: GetCoinsDto): Promise<CoinsListResponseDto> {
    const { page, limit } = query;
    const { data, count } = await this.coinsService.getLatestCoins(page, limit);
    return { data: (data as CoinDto[]) ?? [], count };
  }

  @Get(COINS_STATUS_ENDPOINT)
  @ApiOperation({
    summary: "Cache status",
    description: "Returns the last update time and number of coins cached.",
  })
  @ApiResponse({
    status: 200,
    description: "Cache status",
    type: CoinsStatusResponseDto,
  })
  async getStatus(): Promise<CoinsStatusResponseDto> {
    const [lastUpdate, result] = await Promise.all([
      this.coinsService.getLastUpdate(),
      this.coinsService.getLatestCoins(),
    ]);
    return {
      status: "ok",
      lastUpdate,
      coinsCount: result.count,
    };
  }

  @Post(COINS_TRIGGER_UPDATE_ENDPOINT)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: "Trigger manual fetch",
    description:
      "Forces an immediate fetch from CoinGecko. Rate-limited to 1 req / 60s.",
  })
  @ApiResponse({
    status: 202,
    description: "Update triggered",
    type: UpdateTriggeredResponseDto,
  })
  @ApiResponse({ status: 429, description: "Too Many Requests" })
  async triggerUpdate(): Promise<UpdateTriggeredResponseDto> {
    this.logger.log("Manual update triggered");
    await this.coinsService.fetchAndStoreTopCoins();
    return { status: "update_triggered" };
  }
}
