import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

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

  /**
   * Generate multi-resolution tiles from a 360° panorama image
   */
  async generateTiles(imageBuffer: Buffer): Promise<TileConfig> {
    this.logger.log('Starting tile generation...');

    // Get original image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Unable to read image dimensions');
    }

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
