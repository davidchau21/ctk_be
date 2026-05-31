import {
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách thông báo của user" })
  @ApiResponse({ status: 200, description: "Lấy thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.notificationsService.findAll(user.sub);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đánh dấu đã đọc tất cả thông báo" })
  @ApiResponse({ status: 200, description: "Cập nhật thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  markAllAsRead(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.notificationsService.markAllAsRead(user.sub);
  }
}
