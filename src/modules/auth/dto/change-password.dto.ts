import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "OldPass123!" })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: "NewPass456!", minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}
