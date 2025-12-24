import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { getJwtConfig } from 'src/config/jwt.config';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getJwtConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }

