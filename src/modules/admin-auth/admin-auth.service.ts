import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import type { AdminJwtPayload } from "../../common/types/jwt-payload";

@Injectable()
export class AdminAuthService {
  private readonly adminEmail: string;
  private readonly adminPasswordHash: string;
  private readonly expiresIn: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.adminEmail = String(this.config.get("ADMIN_EMAIL") || "").trim().toLowerCase();
    this.adminPasswordHash = String(this.config.get("ADMIN_PASSWORD_HASH") || "");
    this.expiresIn = String(this.config.get("JWT_EXPIRES_IN") || "12h");
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== this.adminEmail) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, this.adminPasswordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const payload: AdminJwtPayload = { sub: "admin", email: this.adminEmail };
    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: this.expiresIn,
    };
  }
}
