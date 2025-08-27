import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../config/app.config';

type ExpirationListener = (expiredKey: string, channel: string, db: number) => void;

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  // Regular Redis client for normal operations
  private readonly redisClient: Redis;
  private readonly logger = new Logger(RedisService.name);
  // Dedicated client for pub/sub operations
  private subscriberClient: Redis;
  // Array to store expiration listeners
  private expirationListeners: ExpirationListener[] = [];

  constructor(private config: AppConfig) {
    const redisConfig = {
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };
    this.redisClient = new Redis(config.redisDbUrl, redisConfig);
    this.subscriberClient = new Redis(config.redisDbUrl, redisConfig);
    
    this.redisClient.on('error', (error: any) => {
      this.logger.error(`Redis Client Error: ${error}`);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis Client Connected');
    });

    this.subscriberClient.on('error', (error: any) => {
      this.logger.error(`Redis Subscriber Error: ${error}`);
    });

    this.subscriberClient.on('connect', () => {
      this.logger.log('Redis Subscriber Connected');
    });
  }

  async onModuleInit() {
    await this.setupKeyspaceNotifications();
    await this.subscribeToExpirationEvents();
  }

  // Enable keyspace notifications for expired events
  private async setupKeyspaceNotifications() {
    try {
      // Enable keyspace notifications for expired events
      // 'Ex' means expired events in keyspace notifications
      await this.redisClient.config('SET', 'notify-keyspace-events', 'Ex');
      this.logger.log('Keyspace notifications enabled for expired events');
    } catch (error) {
      this.logger.error('Failed to enable keyspace notifications:', error);
    }
  }

  // Subscribe to TTL expiration events
  private async subscribeToExpirationEvents() {
    try {
      // Subscribe to expired events for all databases (pattern: __keyevent@*__:expired)
      await this.subscriberClient.psubscribe('__keyevent@*__:expired');

      this.subscriberClient.on('pmessage', (pattern, channel, expiredKey) => {
        this.handleKeyExpiration(expiredKey, channel);
      });

      this.subscriberClient.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error);
      });

      this.logger.log('Subscribed to Redis TTL expiration events');
    } catch (error) {
      this.logger.error('Failed to subscribe to expiration events:', error);
    }
  }

  // Add expiration listener
  public addExpirationListener(callbackFn: (expiredKey: string, channel: string, db: number) => void): void {
    this.expirationListeners.push(callbackFn);
    this.logger.log(`Added expiration listener. Total listeners: ${this.expirationListeners.length}`);
  }

  // Remove expiration listener
  public removeExpirationListener(callbackFn: ExpirationListener): void {
    const index = this.expirationListeners.indexOf(callbackFn);
    if (index > -1) {
      this.expirationListeners.splice(index, 1);
      this.logger.log(`Removed expiration listener. Total listeners: ${this.expirationListeners.length}`);
    }
  }

  // Handle key expiration events
  private handleKeyExpiration(expiredKey: string, channel: string) {
    this.logger.log(`Key expired: ${expiredKey} on channel: ${channel}`);

    // Extract database number from channel if needed
    const dbMatch = channel.match(/__keyevent@(\d+)__:expired/);
    const database = dbMatch ? parseInt(dbMatch[1]) : 0;

    // Call all registered listeners
    this.expirationListeners.forEach((listener) => {
      try {
        listener(expiredKey, channel, database);
      } catch (error) {
        this.logger.error(`Error in expiration listener for key ${expiredKey}:`, error);
      }
    });
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async onModuleDestroy() {
    try {
      // Clear listeners
      this.expirationListeners = [];
      
      await this.redisClient.quit();
      await this.subscriberClient.quit();
      this.logger.log('Redis connection closed successfully');
    } catch (error) {
      this.logger.error('Error closing Redis connection:', error);
    }
  }
}