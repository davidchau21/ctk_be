import { Controller, Get, Post, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { QuestsService } from "./quests.service";
import { ClaimQuestDto } from "./dto/claim-quest.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("Quests")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("quests")
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách nhiệm vụ và tiến trình của người dùng" })
  @ApiResponse({ status: 200, description: "Lấy danh sách thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  getUserQuests(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.questsService.getUserQuests(user.sub);
  }

  @Post("daily-checkin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Thực hiện điểm danh hàng ngày để hoàn thành nhiệm vụ" })
  @ApiResponse({ status: 200, description: "Điểm danh thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  async dailyCheckin(@Req() req: Request) {
    const user = req.user as JwtPayload;
    const progress = await this.questsService.completeQuest(user.sub, "daily_login");
    return {
      success: true,
      message: "Điểm danh hàng ngày thành công!",
      progress,
    };
  }

  @Post("claim/:key")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Nhận phần thưởng mã thông báo CTK vào Ví Game tích lũy" })
  @ApiResponse({ status: 200, description: "Nhận thưởng thành công off-chain" })
  @ApiResponse({ status: 400, description: "Lỗi yêu cầu (chưa hoàn thành hoặc đã nhận thưởng)" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  claimReward(
    @Req() req: Request,
    @Param("key") key: string,
    @Body() dto: ClaimQuestDto
  ) {
    const user = req.user as JwtPayload;
    return this.questsService.claimQuestReward(user.sub, key, dto.walletAddress);
  }

  @Post("withdraw")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rút toàn bộ số dư CTK tích lũy về ví MetaMask/Trust Wallet thực tế" })
  @ApiResponse({ status: 200, description: "Rút phần thưởng thành công lên on-chain" })
  @ApiResponse({ status: 400, description: "Không có số dư tích lũy khả dụng" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  withdrawRewards(
    @Req() req: Request,
    @Body() dto: ClaimQuestDto
  ) {
    const user = req.user as JwtPayload;
    return this.questsService.withdrawAccumulatedRewards(user.sub, dto.walletAddress);
  }
}
