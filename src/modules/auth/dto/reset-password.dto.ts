import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ description: "Token nhận được từ forgot-password" })
  @IsString()
  token: string;

  @ApiProperty({ example: "NewPass456!", minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}
