import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminModel } from '../models/admin.entity';
import { BaseRepository } from '@app/common/base/base.repository';
import { GetAdminsDto } from '../dtos/admin.dto';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';

@Injectable()
export class AdminRepository extends BaseRepository<AdminModel> {
  constructor(
    @InjectRepository(AdminModel)
    private adminRepository: Repository<AdminModel>,
  ) {
    super(adminRepository);
  }

  public async GetAllAdmins(query: GetAdminsDto) {
    const pagination = GetPaginationOptions(query);
    const queryBuilder = this.adminRepository
      .createQueryBuilder('admin')
      .select([
        'admin.id',
        'admin.name',
        'admin.email',
        'admin.role',
        'admin.is_active',
        'admin.created_at',
        'admin.updated_at',
      ])
      .where('admin.is_deleted = FALSE');

    if (query.search) {
      queryBuilder.andWhere(
        '(admin.name ILIKE :search OR admin.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.role) {
      queryBuilder.andWhere('admin.role = :role', { role: query.role });
    }

    queryBuilder
      .orderBy('admin.created_at', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit);

    const [admins, count] = await queryBuilder.getManyAndCount();

    return { admins, count };
  }
}
