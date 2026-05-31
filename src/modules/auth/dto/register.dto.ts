import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  @MaxLength(50)
  displayName: string;

  @ApiProperty({ example: "StrongPass123!", minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
