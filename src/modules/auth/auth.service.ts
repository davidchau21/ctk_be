import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { User, UserDocument } from "./schemas/user.schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtPayload } from "./strategies/jwt.strategy";

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_EXPIRES_HOURS = 1;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Đăng ký ─────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email }).lean();
    if (exists) throw new ConflictException("Email đã được sử dụng");

    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userModel.create({
      email: dto.email,
      displayName: dto.displayName,
      password: hashed,
    });

    this.logger.log(`New user registered: ${user.email}`);
    return this.buildAuthResponse(user);
  }

  // ── Đăng nhập ────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user)
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    if (!user.isActive)
      throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid)
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    user.lastLoginAt = new Date();
    await user.save();

    this.logger.log(`User logged in: ${user.email}`);
    return this.buildAuthResponse(user);
  }

  // ── Đổi mật khẩu (cần đăng nhập) ────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("Không tìm thấy người dùng");

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException("Mật khẩu hiện tại không đúng");

    if (dto.currentPassword === dto.newPassword)
      throw new BadRequestException("Mật khẩu mới phải khác mật khẩu cũ");

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await user.save();

    this.logger.log(`Password changed for user: ${user.email}`);
    return { message: "Đổi mật khẩu thành công" };
  }

  // ── Quên mật khẩu ────────────────────────────────────────────────────────────
  // Thực tế: gửi email chứa resetToken. Tạm thời trả token về response để test.
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email });

    // Luôn trả thông báo chung để không lộ email có tồn tại hay không
    if (!user) {
      return {
        message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi",
      };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + RESET_TOKEN_EXPIRES_HOURS);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    this.logger.log(`Reset token generated for: ${user.email}`);

    // TODO: Gửi email ở đây khi tích hợp mail service (nodemailer / SendGrid...)
    return {
      message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi",
      // Chỉ trả token trong môi trường dev để test
      ...(this.config.get("NODE_ENV") !== "production" && {
        resetToken: token,
      }),
    };
  }

  // ── Reset mật khẩu (dùng token từ email) ─────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      resetPasswordToken: dto.token,
      resetPasswordExpires: { $gt: new Date() }, // chưa hết hạn
    });

    if (!user)
      throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn");

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    this.logger.log(`Password reset for user: ${user.email}`);
    return { message: "Đặt lại mật khẩu thành công" };
  }

  // ── Lấy thông tin bản thân ────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();
    if (!user) throw new NotFoundException("Không tìm thấy người dùng");
    return user;
  }

  // ── Helper: tạo JWT và trả response ──────────────────────────────────────────
  private buildAuthResponse(user: UserDocument) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshSecret = this.config.get<string>(
      "JWT_REFRESH_SECRET",
      "refresh_fallback",
    );
    const refreshExpiresIn = this.config.get<string>(
      "JWT_REFRESH_EXPIRES_IN",
      "30d",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = this.jwtService.sign(payload as any, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as unknown as number,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}
