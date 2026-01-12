import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from '@app/common/common.module';
import { ThrottlerStorageRedisService } from '@app/common/providers/throttler_storage.service';
import * as Modules from '@app/libs';
import * as Controllers from './controllers';
import { appEnv } from '@app/common/helpers/env.helper';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [CommonModule],
      inject: [ThrottlerStorageRedisService],
      useFactory: (storage: ThrottlerStorageRedisService) => ({
        throttlers: [
          {
            ttl: appEnv('THROTTLE_TTL', 60000),
            limit: appEnv('THROTTLE_LIMIT', 10),
          },
        ],
        storage,
      }),
    }),
    ScheduleModule.forRoot(),
    ...Object.values(Modules),
  ],
  controllers: Object.values(Controllers),
  providers: [
    {
      provide: 'APP_NAME',
      useValue: 'USER',
    },
  ],
})
export class AppModule {}
