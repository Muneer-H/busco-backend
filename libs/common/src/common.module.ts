import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisRepository } from './providers/redis.repository';
import { ThrottlerStorageRedisService } from './providers/throttler_storage.service';
import { MailService } from './providers/mail.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [RedisRepository, ThrottlerStorageRedisService, MailService],
  exports: [RedisRepository, ThrottlerStorageRedisService, MailService],
})
export class CommonModule {}
