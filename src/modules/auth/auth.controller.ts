import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { JwtPayload } from "./strategies/jwt.strategy";
import {
  AUTH_REGISTER_ENDPOINT,
  AUTH_LOGIN_ENDPOINT,
  AUTH_CHANGE_PASSWORD_ENDPOINT,
  AUTH_FORGOT_PASSWORD_ENDPOINT,
  AUTH_RESET_PASSWORD_ENDPOINT,
  AUTH_ME_ENDPOINT,
} from "../../common/constants/endpoint.constant";

@ApiTags("Auth")
@UseGuards(JwtAuthGuard)
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/register ───────────────────────────────────────────────────
  @Post(AUTH_REGISTER_ENDPOINT)
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Đăng ký tài khoản mới" })
  @ApiResponse({
    status: 201,
    description: "Đăng ký thành công, trả về accessToken + refreshToken",
  })
  @ApiResponse({ status: 409, description: "Email đã tồn tại" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ── POST /auth/login ──────────────────────────────────────────────────────
  @Post(AUTH_LOGIN_ENDPOINT)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng nhập" })
  @ApiResponse({
    status: 200,
    description: "Đăng nhập thành công, trả về accessToken + refreshToken",
  })
  @ApiResponse({ status: 401, description: "Sai email hoặc mật khẩu" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── POST /auth/forgot-password ────────────────────────────────────────────
  @Post(AUTH_FORGOT_PASSWORD_ENDPOINT)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Quên mật khẩu — gửi token reset" })
  @ApiResponse({
    status: 200,
    description:
      "Trả message chung (không lộ email tồn tại hay không). Trong dev trả thêm resetToken.",
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ── POST /auth/reset-password ─────────────────────────────────────────────
  @Post(AUTH_RESET_PASSWORD_ENDPOINT)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đặt lại mật khẩu bằng token" })
  @ApiResponse({ status: 200, description: "Đặt lại thành công" })
  @ApiResponse({ status: 400, description: "Token không hợp lệ hoặc hết hạn" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ── POST /auth/change-password (cần đăng nhập) ───────────────────────────
  @Post(AUTH_CHANGE_PASSWORD_ENDPOINT)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đổi mật khẩu (cần đăng nhập)" })
  @ApiResponse({ status: 200, description: "Đổi thành công" })
  @ApiResponse({ status: 400, description: "Mật khẩu hiện tại sai" })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const user = req.user as JwtPayload;
    return this.authService.changePassword(user.sub, dto);
  }

  // ── GET /auth/me (cần đăng nhập) ─────────────────────────────────────────
  @Get(AUTH_ME_ENDPOINT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy thông tin bản thân" })
  @ApiResponse({
    status: 200,
    description: "Thông tin user (không có password)",
  })
  @ApiResponse({ status: 401, description: "Chưa đăng nhập" })
  getMe(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.authService.getMe(user.sub);
  }
}
