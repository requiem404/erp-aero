import { ConfigService } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";

export const getJwtConfig = async (configService: ConfigService): Promise<JwtModuleOptions> => {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      algorithm: 'HS256',
      expiresIn: configService.getOrThrow('JWT_ACCESS_TOKEN_TTL'),
    },
  };
}