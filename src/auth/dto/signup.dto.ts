import { IsString, Matches, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const idPattern = /^(\+?\d{10,15}|[^@\s]+@[^@\s]+\.[^@\s]+)$/i;

export class SignupDto {
  @ApiProperty({
    description: 'ID пользователя (номер телефона или email)',
    example: 'user@example.com',
    pattern: idPattern.toString(),
  })
  @IsString()
  @Matches(idPattern, { message: 'id must be phone number or email' })
  id: string;

  @ApiProperty({
    description: 'Пароль пользователя (минимум 6 символов)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'ID сессии (опционально, генерируется автоматически)',
    example: '1705312200000-abc123-def456',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

