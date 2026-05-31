import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, IsIn, IsPositive } from "class-validator";

export class CreatePriceAlertDto {
  @ApiProperty({ example: "BTC", description: "Symbol of coin (e.g. BTC, ETH)" })
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @ApiProperty({ example: 68500, description: "Target threshold price for alert" })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  targetPrice: number;

  @ApiProperty({ example: "above", enum: ["above", "below"], description: "Trigger condition" })
  @IsNotEmpty()
  @IsString()
  @IsIn(["above", "below"])
  condition: "above" | "below";
}
