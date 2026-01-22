import { Body, Controller, Post } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { AdminAuthService } from "./admin-auth.service";

@Controller("/admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}
