import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectS3, S3 } from 'nestjs-s3';
import { S3Config } from '../config/s3.config';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

import {
  PutObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandOutput,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

export interface S3FileMetadata {
  id: string;
  key: string; // S3 object key
  bucket: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadTo: string;
  isPublic: boolean;
  etag: string;
  url: string;
  signedUrl?: string;
  uploadedAt: Date;
  customMetadata?: Record<string, string>;
}

export interface S3UploadResult {
  files: S3FileMetadata[];
  uploadedCount: number;
  failedCount: number;
  errors?: string[];
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly config: S3Config,
  ) {}
  onModuleInit() {
    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists, create if not
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: '.bucket-check',
        }),
      );
    } catch (error) {
      this.logger.log(`Initializing S3 bucket: ${this.config.bucket}`);
      // Bucket initialization would be handled by your infrastructure
    }
  }

  async uploadSingleFile(
    file: Express.Multer.File,
    uploadTo: string,
    isPublic = false,
    customMetadata?: Record<string, string>,
  ): Promise<S3FileMetadata> {
    const fileId = uuidv4();
    const fileExtension = extname(file.originalname);
    const filename = `${fileId}${fileExtension}`;
    const key = this.generateS3Key(uploadTo, filename);

    this.logger.log(`Uploading to S3: ${file.originalname} -> ${key}`);

    try {
      // Create upload stream
      const uploadParams: PutObjectCommandInput = {
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          originalName: file.originalname,
          uploadId: fileId,
          uploadTo: uploadTo,
          uploadedAt: new Date().toISOString(),
          ...customMetadata,
        },
        ...(isPublic && { ACL: 'public-read' }),
      };

      // Use AWS SDK's Upload class for better handling
      const upload = new Upload({
        client: this.s3,
        params: uploadParams,
        partSize: 5 * 1024 * 1024, // 5MB parts
        queueSize: 4, // 4 concurrent uploads
      });

      // Monitor progress
      upload.on('httpUploadProgress', (progress) => {
        const percentage =
          ((progress.loaded || 0) / (progress.total || 1)) * 100;
        this.logger.debug(
          `Upload progress: ${filename} - ${percentage.toFixed(2)}%`,
        );
      });

      const result = await upload.done();

      // Generate URLs
      const publicUrl = this.generatePublicUrl(key);
      const signedUrl = isPublic
        ? undefined
        : await this.generateSignedUrl(key);

      const fileMetadata: S3FileMetadata = {
        id: fileId,
        key,
        bucket: this.config.bucket,
        filename,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        uploadTo,
        isPublic,
        etag: result.ETag?.replace(/"/g, '') || '',
        url: isPublic ? publicUrl : signedUrl!,
        signedUrl: isPublic ? undefined : signedUrl,
        uploadedAt: new Date(),
        customMetadata,
        
      };

      this.logger.log(
        `File uploaded successfully: ${filename} (${this.formatFileSize(file.size)})`,
      );
      return fileMetadata;
    } catch (error) {
      this.logger.error(
        `Failed to upload file ${file.originalname}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadTo: string,
    isPublic = false,
    customMetadata?: Record<string, string>,
  ): Promise<S3UploadResult> {
    this.logger.log(`Starting batch upload of ${files.length} files`);

    const result: S3UploadResult = {
      files: [],
      uploadedCount: 0,
      failedCount: 0,
      errors: [],
    };

    // Process files concurrently (but limit concurrency)
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(files, concurrencyLimit);

    for (const chunk of chunks) {
      const uploadPromises = chunk.map(async (file) => {
        try {
          const fileMetadata = await this.uploadSingleFile(
            file,
            uploadTo,
            isPublic,
            customMetadata,
          );
          result.files.push(fileMetadata);
          result.uploadedCount++;
        } catch (error) {
          result.failedCount++;
          result.errors?.push(`${file.originalname}: ${error.message}`);
          this.logger.error(
            `Failed to upload ${file.originalname}: ${error.message}`,
          );
        }
      });

      await Promise.all(uploadPromises);
    }

    this.logger.log(
      `Batch upload completed: ${result.uploadedCount} success, ${result.failedCount} failed`,
    );
    return result;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );

      this.logger.log(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`);
      return false;
    }
  }

  async getFileMetadata(key: string): Promise<S3FileMetadata | null> {
    try {
      const result = await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );

      const isPublic = result.Metadata?.['x-amz-acl'] === 'public-read';
      const publicUrl = this.generatePublicUrl(key);
      const signedUrl = isPublic
        ? undefined
        : await this.generateSignedUrl(key);

      return {
        id: result.Metadata?.['upload-id'] || '',
        key,
        bucket: this.config.bucket,
        filename: key.split('/').pop() || '',
        originalName: result.Metadata?.['original-name'] || '',
        contentType: result.ContentType || 'application/octet-stream',
        size: result.ContentLength || 0,
        uploadTo: result.Metadata?.['upload-to'] || '',
        isPublic,
        etag: result.ETag?.replace(/"/g, '') || '',
        url: isPublic ? publicUrl : signedUrl!,
        signedUrl: isPublic ? undefined : signedUrl,
        uploadedAt: new Date(result.LastModified || Date.now()),
        customMetadata: this.extractCustomMetadata(result.Metadata || {}),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file metadata for ${key}: ${error.message}`,
      );
      return null;
    }
  }

  async generateSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3, command, { expiresIn });
  }

  private generateS3Key(uploadTo: string, filename: string): string {
    const sanitizedUploadTo = uploadTo.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    return `${sanitizedUploadTo}/${filename}`;
  }

  private generatePublicUrl(key: string): string {
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }

  private extractCustomMetadata(
    metadata: Record<string, string>,
  ): Record<string, string> {
    const customMetadata: Record<string, string> = {};
    const systemKeys = [
      'original-name',
      'upload-id',
      'upload-to',
      'uploaded-at',
    ];

    Object.entries(metadata).forEach(([key, value]) => {
      if (!systemKeys.includes(key)) {
        customMetadata[key] = value;
      }
    });

    return customMetadata;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Health check method
  async checkS3Health(): Promise<{
    status: 'healthy' | 'unhealthy';
    endpoint: string;
    bucket: string;
    accessible: boolean;
    error?: string;
  }> {
    try {
      // Try to list objects to check connectivity
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: 'health-check-key', // This will likely 404, but that's fine - we just want to test connectivity
        }),
      );

      return {
        status: 'healthy',
        endpoint: this.config.endpoint,
        bucket: this.config.bucket,
        accessible: true,
      };
    } catch (error: any) {
      const isConnectionError = error.name !== 'NotFound';

      return {
        status: isConnectionError ? 'unhealthy' : 'healthy',
        endpoint: this.config.endpoint,
        bucket: this.config.bucket,
        accessible: !isConnectionError,
        error: isConnectionError ? error.message : undefined,
      };
    }
  }
}
