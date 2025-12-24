import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.id, dto.password);
  }

  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto.id, dto.password);
  }

  @Post('signin/new_token')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }
}

