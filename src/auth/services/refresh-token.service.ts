import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  async createRefreshToken(
    userId: string,
    refreshToken: string,
    sessionId: string,
  ): Promise<RefreshToken> {
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const tokenEntity = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      sessionId: sessionId || null,
    });

    return this.refreshTokenRepository.save(tokenEntity);
  }

  async findRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
    });

    for (const tokenEntity of tokens) {
      const isValid = await bcrypt.compare(
        refreshToken,
        tokenEntity.tokenHash,
      );

      if (isValid) {
        return tokenEntity;
      }
    }

    return null;
  }

  async deleteRefreshToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ id: tokenId });
  }

  async deleteAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  async deleteRefreshTokenByToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const tokenEntity = await this.findRefreshToken(userId, refreshToken);

    if (tokenEntity) {
      await this.deleteRefreshToken(tokenEntity.id);
    }
  }

  async deleteRefreshTokenBySessionId(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.refreshTokenRepository.delete({ userId, sessionId });
  }

  async isSessionActive(userId: string, sessionId: string): Promise<boolean> {
    const token = await this.refreshTokenRepository.findOne({
      where: { userId, sessionId },
    });
    return !!token;
  }
}

