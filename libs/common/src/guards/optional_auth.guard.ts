import { AdminService } from '@app/admin/admin.service';
import { UserService } from '@app/user/user.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';

@Injectable()
export class OptionalAuthGuard implements CanActivate, OnModuleInit {
  private userService: UserService;
  private adminService: AdminService;
  constructor(
    private moduleRef: ModuleRef,
    private reflector: Reflector,
    @Inject('APP_NAME') private appName: string,
  ) {}

  onModuleInit() {
    this.userService = this.moduleRef.get(UserService, {
      strict: false,
    });
    this.adminService = this.moduleRef.get(AdminService, {
      strict: false,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    let token = req.headers['authorization'] || req.headers['Authorization'];

    if (!token) {
      return true;
    }

    if (token.startsWith('Bearer')) {
      token = token.split(' ')[1];
    }

    let redisUser: Record<string, any>;
    if (this.appName == 'USER') {
      redisUser = await this.userService.GetUserFromToken(token);
    } else if (this.appName == 'ADMIN') {
      redisUser = await this.adminService.GetAdminFromToken(token);
    } else {
      throw new Error('Unknown application');
    }

    req['user'] = redisUser;

    if (!requiredRoles.length || requiredRoles.includes(redisUser.role)) {
      return true;
    }

    return false;
  }
}
