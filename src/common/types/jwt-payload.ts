import { Role } from '../enums/role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

/** @deprecated use JwtPayload */
export type AdminJwtPayload = JwtPayload;
