import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisRepository } from './redis.repository';
import { appEnv } from '../helpers/env.helper';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  private prefix: string;

  constructor(private redisRepository: RedisRepository) {
    this.prefix = `${appEnv('REDIS_PREFIX', '')}-throttle`;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = this.redisRepository.GetConnection();
    const redisKey = `${this.prefix}:${throttlerName}:${key}`;

    const totalHits = Number(await redis.incr(redisKey));

    if (totalHits === 1) {
      await redis.pExpire(redisKey, ttl);
    }

    const timeToExpire = Number(await redis.pTTL(redisKey));
    const isBlocked = totalHits > limit;

    return {
      totalHits,
      timeToExpire: timeToExpire > 0 ? timeToExpire : 0,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }
}
