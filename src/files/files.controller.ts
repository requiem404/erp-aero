import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiProduces,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { FileListDto } from './dto/file-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MulterFile } from './interfaces';

@ApiTags('Файлы')
@Controller('file')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Загрузка нового файла' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Файл для загрузки',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Файл успешно загружен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
        name: { type: 'string', example: 'document.pdf' },
        extension: { type: 'string', example: 'pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 102400 },
        uploadDate: { type: 'string', format: 'date-time' },
        filePath: { type: 'string', example: '1705312200000-abc123-document.pdf' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Ошибка загрузки файла' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async uploadFile(@UploadedFile() file: MulterFile) {
    return this.filesService.uploadFile(file);
  }

  @Get('list')
  @ApiOperation({ summary: 'Получить список файлов с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы', example: 1 })
  @ApiQuery({ name: 'list_size', required: false, type: Number, description: 'Размер страницы', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Список файлов',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              extension: { type: 'string' },
              mimeType: { type: 'string' },
              size: { type: 'number' },
              uploadDate: { type: 'string', format: 'date-time' },
              filePath: { type: 'string' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            list_size: { type: 'number' },
            total: { type: 'number' },
            total_pages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getFilesList(@Query() query: FileListDto) {
    const page = query.page || 1;
    const listSize = query.list_size || 10;
    return this.filesService.getFiles(page, listSize);
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Скачать файл по ID' })
  @ApiParam({ name: 'id', description: 'UUID файла', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiProduces('application/octet-stream')
  @ApiResponse({
    status: 200,
    description: 'Файл успешно скачан',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { file, fileEntity } = await this.filesService.downloadFile(id);
    res.setHeader('Content-Type', fileEntity.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileEntity.name}"`,
    );
    res.send(file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить информацию о файле по ID' })
  @ApiParam({ name: 'id', description: 'UUID файла', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Информация о файле',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        extension: { type: 'string' },
        mimeType: { type: 'string' },
        size: { type: 'number' },
        uploadDate: { type: 'string', format: 'date-time' },
        filePath: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getFileById(id);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Удалить файл по ID' })
  @ApiParam({ name: 'id', description: 'UUID файла', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Файл успешно удален',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'File deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
    await this.filesService.deleteFile(id);
    return { message: 'File deleted successfully' };
  }

  @Put('update/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Обновить файл по ID' })
  @ApiParam({ name: 'id', description: 'UUID файла', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Новый файл для замены',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Файл успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        extension: { type: 'string' },
        mimeType: { type: 'string' },
        size: { type: 'number' },
        uploadDate: { type: 'string', format: 'date-time' },
        filePath: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Ошибка обновления файла' })
  @ApiResponse({ status: 404, description: 'Файл не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async updateFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
  ) {
    return this.filesService.updateFile(id, file);
  }
}

