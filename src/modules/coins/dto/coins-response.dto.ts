import { ApiProperty } from "@nestjs/swagger";
import { CoinDto } from "./coin.dto";

export class CoinsListResponseDto {
  @ApiProperty({
    type: [CoinDto],
    description: "List of top 50 coins by market cap",
  })
  data: CoinDto[];

  @ApiProperty({ example: 50, description: "Total number of coins returned" })
  count: number;
}

export class CoinsStatusResponseDto {
  @ApiProperty({ example: "ok" })
  status: string;

  @ApiProperty({ example: "2026-03-03T09:30:00.000Z", nullable: true })
  lastUpdate: string | null;

  @ApiProperty({ example: 50 })
  coinsCount: number;
}

export class UpdateTriggeredResponseDto {
  @ApiProperty({ example: "update_triggered" })
  status: string;
}
