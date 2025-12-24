import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'files' })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'extension', type: 'varchar', length: 50 })
  extension: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'size', type: 'bigint' })
  size: number;

  @Column({ name: 'upload_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  uploadDate: Date;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;
}

