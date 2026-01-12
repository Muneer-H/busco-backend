import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminModel } from './models/admin.entity';
import { AdminRepository } from './repositories/admin.repository';
import { appEnv } from '@app/common/helpers/env.helper';
import { CommonModule } from '@app/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminModel]),
    JwtModule.register({
      secret: appEnv('JWT_SECRET'),
    }),
    CommonModule,
  ],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}
