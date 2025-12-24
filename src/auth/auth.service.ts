import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

type ExpiresInType = JwtSignOptions['expiresIn']

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_TOKEN_TTL: ExpiresInType;
  private readonly JWT_REFRESH_TOKEN_TTL: ExpiresInType;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<ExpiresInType>('JWT_ACCESS_TOKEN_TTL');
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<ExpiresInType>('JWT_REFRESH_TOKEN_TTL');
  }

  async signup(id: string, password: string): Promise<Tokens> {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(id, passwordHash);
    const tokens = await this.generateTokens(user.id);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
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

    const tokens = await this.generateTokens(user.id);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    let user: User;

    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(userId, hash);
  }

  private async generateTokens(userId: string): Promise<Tokens> {
    const accessTokenOptions: JwtSignOptions = {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    };
    const refreshTokenOptions: JwtSignOptions = {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId }, accessTokenOptions),
      this.jwtService.signAsync({ sub: userId }, refreshTokenOptions),
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
}

