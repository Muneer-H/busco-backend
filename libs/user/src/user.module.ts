import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { UserModel } from './models/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '@app/common/common.module';
import { appEnv } from '@app/common/helpers/env.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel]),
    JwtModule.register({
      secret: appEnv('ACCESS_TOKEN_SECRET'),
    }),
    CommonModule,
  ],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
