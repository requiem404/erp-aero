import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RefreshTokenService } from './services/refresh-token.service';
import { ExpiresInType, Tokens } from './interfaces';


@Injectable()
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_TOKEN_TTL: ExpiresInType;
  private readonly JWT_REFRESH_TOKEN_TTL: ExpiresInType;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<ExpiresInType>('JWT_ACCESS_TOKEN_TTL');
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<ExpiresInType>('JWT_REFRESH_TOKEN_TTL');
  }

  async signup(id: string, password: string): Promise<Tokens> {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(id, passwordHash);
    const sessionId = this.generateSessionId();
    const tokens = await this.generateTokens(user.id, sessionId);

    await this.refreshTokenService.createRefreshToken(
      user.id,
      tokens.refreshToken,
      sessionId,
    );

    return {
      ...tokens,
      sessionId,
    };
  }

  async signin(id: string, password: string): Promise<Tokens> {
    let user: User;

    try {
      user = await this.usersService.findById(id);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = this.generateSessionId();
    const tokens = await this.generateTokens(user.id, sessionId);
    await this.refreshTokenService.createRefreshToken(
      user.id,
      tokens.refreshToken,
      sessionId,
    );

    return {
      ...tokens,
      sessionId,
    };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    let user: User;

    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenEntity = await this.refreshTokenService.findRefreshToken(
      user.id,
      refreshToken,
    );

    if (!tokenEntity) {
      throw new UnauthorizedException('Refresh token not found');
    }

    await this.refreshTokenService.deleteRefreshToken(tokenEntity.id);
    const sessionId = tokenEntity.sessionId || this.generateSessionId();
    const tokens = await this.generateTokens(user.id, sessionId);
    await this.refreshTokenService.createRefreshToken(
      user.id,
      tokens.refreshToken,
      sessionId,
    );

    return {
      ...tokens,
      sessionId,
    };
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.refreshTokenService.deleteRefreshTokenBySessionId(
        userId,
        sessionId,
      );
    } else {
      await this.refreshTokenService.deleteAllUserTokens(userId);
    }
  }

  async getUserInfo(userId: string): Promise<{ id: string }> {
    const user = await this.usersService.findById(userId);
    return { id: user.id };
  }

  private async generateTokens(userId: string, sessionId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenOptions: JwtSignOptions = {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    };
    const refreshTokenOptions: JwtSignOptions = {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, sessionId }, accessTokenOptions),
      this.jwtService.signAsync({ sub: userId, sessionId }, refreshTokenOptions),
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

