import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Role } from "../../common/enums/role.enum";
import type { JwtPayload } from "../../common/types/jwt-payload";

interface StaffAccount {
  email: string;
  passwordHash: string;
  role: Role;
}

@Injectable()
export class AdminAuthService {
  private readonly accounts: StaffAccount[];
  private readonly expiresIn: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.expiresIn = String(this.config.get("JWT_EXPIRES_IN") || "12h");

    this.accounts = [
      {
        email: String(this.config.get("ADMIN_EMAIL") || "").trim().toLowerCase(),
        passwordHash: String(this.config.get("ADMIN_PASSWORD_HASH") || ""),
        role: Role.ADMIN,
      },
      {
        email: String(this.config.get("HOST_EMAIL") || "").trim().toLowerCase(),
        passwordHash: String(this.config.get("HOST_PASSWORD_HASH") || ""),
        role: Role.HOST,
      },
    ];
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const account = this.accounts.find(a => a.email && a.email === normalizedEmail);
    if (!account) throw new UnauthorizedException("Invalid credentials.");

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials.");

    const payload: JwtPayload = {
      sub: account.role,
      email: account.email,
      role: account.role,
    };

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: this.expiresIn,
      role: account.role,
    };
  }
}
