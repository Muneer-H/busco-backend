import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { UserFollowRepository } from './repositories/user_follow.repository';
import { UserModel } from './models/user.entity';
import { UserFollowModel } from './models/user_follow.entity';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '@app/common/common.module';
import { appEnv } from '@app/common/helpers/env.helper';
import { DeviceModule } from '@app/device/device.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, UserFollowModel]),
    JwtModule.register({
      secret: appEnv('ACCESS_TOKEN_SECRET'),
    }),
    CommonModule,
    DeviceModule,
  ],
  providers: [UserService, UserRepository, UserFollowRepository],
  exports: [UserService, UserRepository, UserFollowRepository],
})
export class UserModule {}
