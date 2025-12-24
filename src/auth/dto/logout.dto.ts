import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'ID сессии для выхода (если не указан, выходит из всех сессий)',
    example: '1705312200000-abc123-def456',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

