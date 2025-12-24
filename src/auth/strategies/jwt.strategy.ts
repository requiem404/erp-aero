import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from '../services/refresh-token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256']
    });
  }

  async validate(payload: { sub: string; sessionId?: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Проверяем, что сессия активна (refresh токен с таким sessionId существует)
    if (payload.sessionId) {
      const isActive = await this.refreshTokenService.isSessionActive(
        payload.sub,
        payload.sessionId,
      );
      if (!isActive) {
        throw new UnauthorizedException('Session expired or invalid');
      }
    }

    return { userId: payload.sub, sessionId: payload.sessionId };
  }
}

