import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from '@app/admin/admin.service';
import {
  AdminLoginDto,
  CreateAdminDto,
  GetAdminsDto,
  UpdateAdminDto,
} from '@app/admin/dtos/admin.dto';
import { Authorized } from '@app/common/decorators/authorized.decorator';
import { CurrentUser } from '@app/common/decorators/current_user.decorator';
import type { IRedisAdmin } from '@app/admin/models/admin.entity';
import { type Request } from 'express';

@ApiTags('Admin')
@Controller()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('/login')
  async Login(@Body() dto: AdminLoginDto) {
    return await this.adminService.Login(dto);
  }

  @Authorized()
  @Post('/logout')
  async Logout(@CurrentUser() admin: IRedisAdmin, @Req() req: Request) {
    const token = req.headers['authorization']?.split(' ')[1];
    return await this.adminService.Logout(token, admin);
  }

  @Authorized()
  @Get('/me')
  async Me(@CurrentUser() admin: IRedisAdmin) {
    return await this.adminService.Me(admin);
  }

  @Authorized()
  @Post('/admins')
  async CreateAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.adminService.CreateAdmin(dto, actor);
  }

  @Authorized()
  @Get('/admins')
  async GetAllAdmins(@Query() query: GetAdminsDto) {
    return await this.adminService.GetAllAdmins(query);
  }

  @Authorized()
  @Get('/admins/:id')
  async GetAdminById(@Param('id') id: number) {
    return await this.adminService.GetAdminById(id);
  }

  @Authorized()
  @Put('/admins/:id')
  async UpdateAdmin(
    @Param('id') id: number,
    @Body() dto: UpdateAdminDto,
    @CurrentUser() actor: IRedisAdmin,
  ) {
    return await this.adminService.UpdateAdmin(id, dto, actor);
  }
}
