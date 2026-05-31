import { ApiProperty } from "@nestjs/swagger";

export class CoinDto {
  @ApiProperty({ example: "bitcoin", description: "Unique coin identifier" })
  id: string;

  @ApiProperty({ example: "BTC", description: "Trading symbol" })
  symbol: string;

  @ApiProperty({ example: "Bitcoin", description: "Full name of the coin" })
  name: string;

  @ApiProperty({
    example: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  })
  image: string;

  @ApiProperty({ example: 65000.12, description: "Current price in USD" })
  current_price: number;

  @ApiProperty({
    example: 1280000000000,
    description: "Market capitalisation in USD",
  })
  market_cap: number;

  @ApiProperty({ example: 1, description: "Market cap rank" })
  market_cap_rank: number;

  @ApiProperty({
    example: 45000000000,
    description: "24h trading volume in USD",
  })
  total_volume: number;

  @ApiProperty({ example: 2.45, description: "24h price change percentage" })
  price_change_percentage_24h: number;

  @ApiProperty({ example: 19700000, description: "Circulating supply" })
  circulating_supply: number;

  @ApiProperty({
    example: 21000000,
    nullable: true,
    description: "Max supply (null if unlimited)",
  })
  max_supply: number | null;

  @ApiProperty({
    example: "2026-03-03T09:00:00.000Z",
    description: "Last data update time",
  })
  last_updated: string;
}
