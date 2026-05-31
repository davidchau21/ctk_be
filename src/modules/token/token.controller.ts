import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { TokenService } from "./token.service";

@ApiTags("Token")
@Controller("token")
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get("info")
  @ApiOperation({ summary: "Lấy thông tin cấu hình token CTK (name, symbol, totalSupply, address)" })
  @ApiResponse({ status: 200, description: "Lấy thông tin thành công" })
  getInfo() {
    return this.tokenService.getTokenInfo();
  }

  @Get("balance/:address")
  @ApiOperation({ summary: "Lấy số dư token CTK của một ví cụ thể" })
  @ApiParam({ name: "address", required: true, example: "0x71c7656ec7ab88b098defb751b7401b5f6d8976f" })
  @ApiResponse({ status: 200, description: "Lấy số dư thành công" })
  getBalance(@Param("address") address: string) {
    return this.tokenService.getBalance(address);
  }
}
