import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([File]), AuthModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule { }

