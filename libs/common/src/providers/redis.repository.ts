import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

@Injectable()
export class RedisRepository {
  private connection: RedisClient;
  private prefix: string;

  constructor(private configService: ConfigService) {
    this.createConnection();
    this.prefix = this.configService.get<string>('REDIS_PREFIX', '');
  }

  private async createConnection() {
    this.connection = createClient({
      url: this.configService.get('REDIS_URL'),
      disableOfflineQueue: true,
    });
    await this.connection.connect();
    console.log('Redis Connected');
  }

  public async Set(key: string | number, data: any, expireInSeconds?: number) {
    key = `${this.prefix}-${key}`;
    if (!expireInSeconds) {
      expireInSeconds = this.configService.get<number>(
        'REDIS_DEFAULT_TTL',
        2592000,
      );
    }
    return await this.connection.set(key, data, { EX: expireInSeconds });
  }

  public async Get(key: string | number) {
    key = `${this.prefix}-${key}`;
    const result = await this.connection.get(key);
    if (result) {
      return result.toString();
    }
    return null;
  }

  public async ExpireAt(key: string | number, timeStamp: number) {
    key = `${this.prefix}-${key}`;
    return await this.connection.expireAt(key, timeStamp);
  }

  public async Delete(key: string) {
    key = `${this.prefix}-${key}`;
    return await this.connection.del(key);
  }

  public async GetKeys(pattern: string) {
    pattern = `${this.prefix}-${pattern}`;
    const keys = await this.connection.keys(pattern);

    // remove environment prefix from keys
    return keys.map((key: string) => key.replace(`${this.prefix}-`, ''));
  }

  public GetConnection(): RedisClient {
    return this.connection;
  }
}
