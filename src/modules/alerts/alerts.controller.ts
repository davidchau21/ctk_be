import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { AlertsService } from "./alerts.service";
import { CreatePriceAlertDto } from "./dto/create-price-alert.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/strategies/jwt.strategy";

@ApiTags("Alerts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Tạo cảnh báo giá mới" })
  @ApiResponse({ status: 201, description: "Tạo thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  create(@Req() req: Request, @Body() dto: CreatePriceAlertDto) {
    const user = req.user as JwtPayload;
    return this.alertsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách toàn bộ cảnh báo của user" })
  @ApiResponse({ status: 200, description: "Lấy thành công" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.alertsService.findAll(user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Xóa/Hủy cảnh báo giá" })
  @ApiResponse({ status: 200, description: "Xóa thành công" })
  @ApiResponse({ status: 404, description: "Không tìm thấy hoặc không có quyền" })
  remove(@Req() req: Request, @Param("id") id: string) {
    const user = req.user as JwtPayload;
    return this.alertsService.remove(user.sub, id);
  }
}
