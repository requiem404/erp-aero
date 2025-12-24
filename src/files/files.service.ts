import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { join } from 'path';
import { MulterFile } from './interfaces';


@Injectable()
export class FilesService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: MulterFile): Promise<File> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileExtension = path.extname(file.originalname).slice(1);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    const filePath = join(this.uploadDir, fileName);

    try {
      await fs.writeFile(filePath, file.buffer);

      const fileEntity = this.filesRepository.create({
        name: file.originalname,
        extension: fileExtension,
        mimeType: file.mimetype,
        size: file.size,
        filePath: fileName,
        uploadDate: new Date(),
      });

      return await this.filesRepository.save(fileEntity);
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async getFiles(page: number = 1, listSize: number = 10) {
    const skip = (page - 1) * listSize;
    const [files, total] = await this.filesRepository.findAndCount({
      skip,
      take: listSize,
      order: { uploadDate: 'DESC' },
    });

    return {
      files,
      pagination: {
        page,
        list_size: listSize,
        total,
        total_pages: Math.ceil(total / listSize),
      },
    };
  }

  async getFileById(id: string): Promise<File> {
    const file = await this.filesRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.getFileById(id);
    const filePath = join(this.uploadDir, file.filePath);

    try {
      await fs.unlink(filePath);
    } catch (error) {
    }

    await this.filesRepository.remove(file);
  }

  async downloadFile(id: string): Promise<{ file: Buffer; fileEntity: File }> {
    const fileEntity = await this.getFileById(id);
    const filePath = join(this.uploadDir, fileEntity.filePath);

    try {
      const fileBuffer = await fs.readFile(filePath);
      return { file: fileBuffer, fileEntity };
    } catch (error) {
      throw new NotFoundException('File not found on disk');
    }
  }

  async updateFile(id: string, newFile: MulterFile): Promise<File> {
    if (!newFile) {
      throw new BadRequestException('File is required');
    }

    const fileEntity = await this.getFileById(id);
    const oldFilePath = join(this.uploadDir, fileEntity.filePath);

    const fileExtension = path.extname(newFile.originalname).slice(1);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${newFile.originalname}`;
    const newFilePath = join(this.uploadDir, fileName);

    try {
      try {
        await fs.unlink(oldFilePath);
      } catch (error) { }

      await fs.writeFile(newFilePath, newFile.buffer);

      fileEntity.name = newFile.originalname;
      fileEntity.extension = fileExtension;
      fileEntity.mimeType = newFile.mimetype;
      fileEntity.size = newFile.size;
      fileEntity.filePath = fileName;
      fileEntity.uploadDate = new Date();

      return await this.filesRepository.save(fileEntity);
    } catch (error) {
      throw new BadRequestException(`Failed to update file: ${error.message}`);
    }
  }
}

