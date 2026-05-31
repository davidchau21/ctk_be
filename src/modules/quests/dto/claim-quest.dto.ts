import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ClaimQuestDto {
  @ApiProperty({
    description: "Địa chỉ ví MetaMask nhận token CTK của người dùng",
    example: "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
  })
  @IsNotEmpty({ message: "Địa chỉ ví không được để trống" })
  @IsString({ message: "Địa chỉ ví phải là chuỗi ký tự" })
  walletAddress: string;
}
