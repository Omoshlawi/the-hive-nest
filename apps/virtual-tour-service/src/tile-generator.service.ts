import { HiveFileServiceClient } from '@hive/files';
import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { Readable } from 'stream';
import { extname, basename } from 'path';

export interface TileConfig {
  width: number;
  height: number;
  tileSize: number;
  maxLevel: number;
  tiles: Array<{
    level: number;
    col: number;
    row: number;
    buffer: Buffer;
  }>;
}

@Injectable()
export class TileGeneratorService {
  private readonly logger = new Logger(TileGeneratorService.name);
  private readonly TILE_SIZE = 512;

  constructor(private readonly fileServiceClient: HiveFileServiceClient) {}

  /**
   * Generate multi-resolution tiles from a 360° panorama image URL using streams
   */
  async generateTilesFromUrl(fileUrl: string): Promise<TileConfig> {
    this.logger.log(`Starting tile generation from URL: ${fileUrl}`);

    // Download file as buffer (we need the full image for tiling)
    // For very large files, we could optimize this further with streaming
    const imageBuffer = await this.downloadFileAsBuffer(fileUrl);

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Unable to read image dimensions');
    }

    this.logger.log(`Original image: ${width}x${height}`);

    return this.generateTilesFromBuffer(
      imageBuffer,
      width,
      height,
      basename(fileUrl),
    );
  }

  /**
   * Generate multi-resolution tiles from a 360° panorama image stream
   * This method uses streaming for better memory efficiency with large files
   */
  async generateTilesFromStream(
    imageStream: Readable,
    name: string,
  ): Promise<TileConfig> {
    this.logger.log('Starting tile generation from stream...');

    // Convert stream to buffer for processing
    // Note: For very large files, consider processing in chunks
    const chunks: Buffer[] = [];
    for await (const chunk of imageStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const imageBuffer = Buffer.concat(chunks);

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Unable to read image dimensions');
    }

    this.logger.log(`Original image: ${width}x${height}`);

    return this.generateTilesFromBuffer(imageBuffer, width, height, name);
  }

  /**
   * Generate multi-resolution tiles from a 360° panorama image buffer
   */
  async generateTiles(imageBuffer: Buffer, name: string): Promise<TileConfig> {
    this.logger.log('Starting tile generation from buffer...');

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Unable to read image dimensions');
    }

    return this.generateTilesFromBuffer(imageBuffer, width, height, name);
  }

  /**
   * Internal method to generate tiles from buffer with known dimensions
   */
  private async generateTilesFromBuffer(
    imageBuffer: Buffer,
    width: number,
    height: number,
    name: string,
  ): Promise<TileConfig> {
    this.logger.log(`Original image: ${width}x${height}`);

    // Calculate number of zoom levels
    const maxLevel = this.calculateMaxLevel(width, height);
    this.logger.log(`Generating ${maxLevel + 1} zoom levels`);

    const tiles: TileConfig['tiles'] = [];

    // Generate tiles for each zoom level
    for (let level = 0; level <= maxLevel; level++) {
      const levelTiles = await this.generateLevelTiles(
        imageBuffer,
        level,
        maxLevel,
        width,
        height,
        name,
      );
      tiles.push(...levelTiles);
    }

    this.logger.log(`Generated ${tiles.length} tiles total`);

    return {
      width,
      height,
      tileSize: this.TILE_SIZE,
      maxLevel,
      tiles,
    };
  }

  /**
   * Download file from URL as a stream
   */
  private async downloadFileAsStream(fileUrl: string): Promise<Readable> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Convert web stream to Node.js Readable stream
      return Readable.fromWeb(response.body as any);
    } catch (error) {
      this.logger.error(
        `Failed to download file from ${fileUrl}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Download file from URL as a buffer
   */
  private async downloadFileAsBuffer(fileUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(
        `Failed to download file from ${fileUrl}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Calculate the maximum zoom level based on image dimensions
   */
  private calculateMaxLevel(width: number, height: number): number {
    const maxDimension = Math.max(width, height);
    return Math.ceil(Math.log2(maxDimension / this.TILE_SIZE));
  }

  /**
   * Generate tiles for a specific zoom level
   */
  private async generateLevelTiles(
    imageBuffer: Buffer,
    level: number,
    maxLevel: number,
    originalWidth: number,
    originalHeight: number,
    name: string,
  ): Promise<TileConfig['tiles']> {
    const scale = Math.pow(2, maxLevel - level);
    const levelWidth = Math.ceil(originalWidth / scale);
    const levelHeight = Math.ceil(originalHeight / scale);

    this.logger.log(`Level ${level}: ${levelWidth}x${levelHeight}`);

    // Resize image for this level
    const resizedImage = sharp(imageBuffer).resize(levelWidth, levelHeight, {
      fit: 'fill',
      kernel: 'lanczos3',
    });

    const resizedBuffer = await resizedImage.toBuffer();

    // Calculate number of tiles needed
    const cols = Math.ceil(levelWidth / this.TILE_SIZE);
    const rows = Math.ceil(levelHeight / this.TILE_SIZE);

    const tiles: TileConfig['tiles'] = [];

    // Generate each tile
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * this.TILE_SIZE;
        const y = row * this.TILE_SIZE;
        const tileWidth = Math.min(this.TILE_SIZE, levelWidth - x);
        const tileHeight = Math.min(this.TILE_SIZE, levelHeight - y);

        const tileBuffer = await sharp(resizedBuffer)
          .extract({
            left: x,
            top: y,
            width: tileWidth,
            height: tileHeight,
          })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
        // Save tile buffer to file service
        const file = await this.fileServiceClient.file.createFile({
          queryBuilder: undefined,
          tags: ['tiles', 'virtual-tour'],
          blob: {
            buffer: Uint8Array.from(tileBuffer),
            size: tileBuffer.length.toString(),
            filename: `${name}-${level}-${col}-${row}.jpg`,
            mimeType: `image/${extname(name)}`,
            originalName: `${name}-${level}-${col}-${row}.jpg`,
            fieldName: `tiles`,
            name: `${name}-${level}-${col}-${row}.jpg`,
          },
          relatedModelId: 'virtual-tour',
          relatedModelName: 'virtual-tour',
          purpose: 'virtual-tour',
          metadata: JSON.stringify({
            level,
            col,
            row,
          }),
        });
        tiles.push({
          level,
          col,
          row,
          buffer: tileBuffer,
        });
      }
    }

    return tiles;
  }
}
