import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "../../../common/enums/user-role.enum";

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: "users",
  timestamps: true, // tự thêm createdAt, updatedAt
  versionKey: false,
})
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ type: String, required: true })
  password: string; // bcrypt hashed

  @Prop({ type: String, required: true, trim: true })
  displayName: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  // Dùng cho forgot password flow
  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  // timestamps: true tự inject — khai báo để TS nhận diện
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index compound cho reset password lookup
UserSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });
