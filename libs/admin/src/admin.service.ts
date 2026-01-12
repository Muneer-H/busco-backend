import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminModel, AdminRole, IRedisAdmin } from './models/admin.entity';
import { Comparepassword } from '@app/common/helpers/misc.helper';
import {
  AdminLoginDto,
  CreateAdminDto,
  GetAdminsDto,
  UpdateAdminDto,
} from './dtos/admin.dto';
import { Hashpassword } from '@app/common/helpers/misc.helper';
import { AdminRepository } from './repositories/admin.repository';
import { RedisRepository } from '@app/common/providers/redis.repository';

@Injectable()
export class AdminService {
  constructor(
    private adminRepository: AdminRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisRepository: RedisRepository,
  ) {}

  private getTokenCacheKey(adminId: number, token: string) {
    return `admin:${adminId}:${token}`;
  }

  public async Login(dto: AdminLoginDto) {
    const email = dto.email.toLowerCase();
    const admin = await this.adminRepository.FindOne(
      {
        email,
      },
      {
        select: ['id', 'name', 'email', 'role', 'is_active', 'password'],
      },
    );

    if (!admin) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!admin.is_active) {
      throw new BadRequestException(
        'Your account is deactivated. Please contact with Super Admin.',
      );
    }

    const isPasswordValid = Boolean(
      await Comparepassword(dto.password, admin.password),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: IRedisAdmin = {
      id: admin.id,
      name: admin.name,
      role: admin.role,
    };

    const sessionTimeoutHours =
      this.configService.get<number>('ADMIN_SESSION_TIMEOUT', 12) ?? 12;

    const token = this.jwtService.sign(payload, {
      expiresIn: `${sessionTimeoutHours}h`,
    });

    await this.redisRepository.Set(
      this.getTokenCacheKey(admin.id, token),
      JSON.stringify(payload),
      sessionTimeoutHours * 3600,
    );

    return {
      admin,
      token,
    };
  }

  public async CreateAdmin(
    dto: CreateAdminDto,
    actor: IRedisAdmin,
  ): Promise<AdminModel> {
    const email = dto.email.toLowerCase();
    const existing = await this.adminRepository.FindOne({
      email,
      is_deleted: false,
    });

    if (existing) {
      throw new BadRequestException('Administrator already exists');
    }

    const newAdmin = new AdminModel();
    newAdmin.name = dto.name;
    newAdmin.email = email;
    newAdmin.role = dto.role;
    newAdmin.is_active = dto.is_active;
    newAdmin.password = await Hashpassword(dto.password);

    return this.adminRepository.Create(newAdmin, actor.id);
  }

  public async UpdateAdmin(
    id: number,
    dto: UpdateAdminDto,
    actor: IRedisAdmin,
  ): Promise<AdminModel> {
    const adminModel = await this.adminRepository.FindById(id);

    if (!adminModel) {
      throw new BadRequestException('Administrator not found');
    }

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase();
      const duplicate = await this.adminRepository.FindOne({
        email: normalizedEmail,
        is_deleted: false,
      });

      if (duplicate && duplicate.id !== adminModel.id) {
        throw new BadRequestException('Email already in use');
      }

      adminModel.email = normalizedEmail;
    }

    if (dto.password) {
      adminModel.password = await Hashpassword(dto.password);
    }

    adminModel.name = dto.name ?? adminModel.name;
    adminModel.role = dto.role ?? adminModel.role;
    adminModel.is_active = dto.is_active ?? adminModel.is_active;

    adminModel.updated_by = actor.id;

    return this.adminRepository.Save(adminModel);
  }

  public async Me(admin: IRedisAdmin): Promise<AdminModel> {
    const adminModel = await this.adminRepository.FindById(admin.id);

    return adminModel;
  }

  public async GetAdminFromToken(token: string): Promise<IRedisAdmin> {
    let admin: IRedisAdmin;
    try {
      admin = this.jwtService.verify<IRedisAdmin>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    let cachedAdmin: string | null;
    try {
      cachedAdmin = await this.redisRepository.Get(
        this.getTokenCacheKey(admin.id, token),
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!cachedAdmin) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return JSON.parse(cachedAdmin) as IRedisAdmin;
  }

  public async Logout(token: string, admin: IRedisAdmin) {
    await this.redisRepository.Delete(this.getTokenCacheKey(admin.id, token));
    return { success: true };
  }

  public async GetAllAdmins(query: GetAdminsDto) {
    return this.adminRepository.GetAllAdmins(query);
  }

  public async GetAdminById(id: number): Promise<AdminModel> {
    const admin = await this.adminRepository.FindById(id);

    if (!admin) {
      throw new BadRequestException('Administrator not found');
    }

    return admin;
  }

  public async GetAllActiveAdmins(): Promise<AdminModel[]> {
    return this.adminRepository.Find(
      {
        is_deleted: false,
        is_active: true,
      },
      undefined,
      ['name', 'email'],
    );
  }
}
