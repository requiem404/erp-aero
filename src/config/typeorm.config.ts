import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";

export const getTypeOrmConfig = async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'mysql',
    host: configService.getOrThrow<string>('MYSQL_HOST'),
    port: parseInt(configService.getOrThrow<string>('MYSQL_PORT'), 10),
    username: configService.getOrThrow<string>('MYSQL_USER'),
    password: configService.getOrThrow<string>('MYSQL_PASSWORD'),
    database: configService.getOrThrow<string>('MYSQL_DB'),
    entities: [User],
    synchronize: true,
  };
};