import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DeviceModel } from './models/device.entity';
import { DeviceService } from './device.service';
import { DeviceRepository } from './repositories/device.repository';
import { CommonModule } from '@app/common/common.module';
import { appEnv } from '@app/common/helpers/env.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceModel]),
    JwtModule.register({
      secret: appEnv('JWT_SECRET'),
    }),
    CommonModule,
  ],
  providers: [DeviceService, DeviceRepository],
  exports: [DeviceService, DeviceRepository],
})
export class DeviceModule {}
