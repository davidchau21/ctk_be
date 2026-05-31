import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsLowercase } from "class-validator";

export class CreateSwapDto {
  @ApiProperty({
    example: "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
    description: "User's connected Web3 wallet address",
  })
  @IsNotEmpty()
  @IsString()
  @IsLowercase()
  address: string;

  @ApiProperty({ example: "ETH", description: "Symbol of paid token" })
  @IsNotEmpty()
  @IsString()
  fromToken: string;

  @ApiProperty({ example: "USDT", description: "Symbol of received token" })
  @IsNotEmpty()
  @IsString()
  toToken: string;

  @ApiProperty({ example: "0.5", description: "Amount of paid token" })
  @IsNotEmpty()
  @IsString()
  fromAmount: string;

  @ApiProperty({ example: "1750", description: "Amount of received token" })
  @IsNotEmpty()
  @IsString()
  toAmount: string;

  @ApiProperty({
    example: "0x7a83d9e8312e...e7981",
    description: "Web3 transaction hash of the swap",
  })
  @IsNotEmpty()
  @IsString()
  hash: string;
}
