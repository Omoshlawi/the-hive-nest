import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../config/app.config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: AppConfig) {
    this.redis = new Redis(config.redisDbUrl, {
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error: any) => {
      this.logger.error(`Redis Client Error: ${error}`);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  getClient(): Redis {
    return this.redis;
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed successfully');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
    }
  }
}
