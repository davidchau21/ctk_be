import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { SwapService } from "./swap.service";
import { CreateSwapDto } from "./dto/create-swap.dto";

@ApiTags("Swap")
@Controller("swap")
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new swap transaction record" })
  @ApiResponse({ status: 201, description: "Swap recorded in database successfully" })
  createSwap(@Body() dto: CreateSwapDto) {
    return this.swapService.createSwap(dto);
  }

  @Get("history")
  @ApiOperation({ summary: "Get swap history by wallet address" })
  @ApiQuery({ name: "address", required: true, example: "0x71c7656ec7ab88b098defb751b7401b5f6d8976f" })
  @ApiResponse({ status: 200, description: "History retrieved" })
  getHistory(@Query("address") address: string) {
    return this.swapService.getHistory(address);
  }

  @Get("rate")
  @ApiOperation({ summary: "Get live conversion rate between two tokens" })
  @ApiQuery({ name: "from", required: true, example: "ETH" })
  @ApiQuery({ name: "to", required: true, example: "USDT" })
  @ApiResponse({ status: 200, description: "Rate calculated successfully" })
  getRate(@Query("from") from: string, @Query("to") to: string) {
    return this.swapService.getExchangeRate(from, to);
  }
}
