import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, Index } from 'typeorm';

export enum AdminRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
}

export interface IRedisAdmin {
  id: number;
  name: string;
  role: AdminRole;
}

@Entity('admin')
export class AdminModel extends BaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Index({ unique: true })
  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: false,
    select: false,
  })
  password: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: AdminRole,
    default: AdminRole.Admin,
  })
  role: AdminRole;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  is_active: boolean;
}
