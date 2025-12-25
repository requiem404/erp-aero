import { JwtSignOptions } from "@nestjs/jwt";

export type ExpiresInType = JwtSignOptions['expiresIn']

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};
