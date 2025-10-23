import { Module } from '@nestjs/common';
import { S3Module as NestS3Module } from 'nestjs-s3';
import { S3Config } from '../config/s3.config';
import { S3Service } from './s3.service';
@Module({
  providers: [S3Service],
  exports: [S3Service],
  imports: [
    NestS3Module.forRootAsync({
      useFactory(config: S3Config) {
        return {
          config: {
            credentials: {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secreteAccessKeyId,
            },
            region: 'us-east-1',
            endpoint: config.endpoint,
            forcePathStyle: true,
            signatureVersion: 'v4',
          },
        };
      },
      inject: [S3Config],
    }),
  ],
})
export class S3Module {}
