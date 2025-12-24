import { Body, Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Авторизация')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        sessionId: { type: 'string', example: '1705312200000-abc123-def456' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Пользователь уже существует' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.id, dto.password);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        sessionId: { type: 'string', example: '1705312200000-abc123-def456' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto.id, dto.password);
  }

  @Post('signin/new_token')
  @ApiOperation({ summary: 'Обновление JWT токена по refresh токену' })
  @ApiResponse({
    status: 200,
    description: 'Токены успешно обновлены',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        sessionId: { type: 'string', example: '1705312200000-abc123-def456' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверный refresh токен' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
  @ApiResponse({
    status: 200,
    description: 'Информация о пользователе',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  info(@Request() req) {
    return this.authService.getUserInfo(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Успешный выход из системы',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  logout(@Request() req, @Body() dto?: LogoutDto) {
    // Используем sessionId из body, если передан, иначе из токена
    const sessionId = dto?.sessionId || req.user?.sessionId;
    return this.authService.logout(req.user.userId, sessionId);
  }
}
