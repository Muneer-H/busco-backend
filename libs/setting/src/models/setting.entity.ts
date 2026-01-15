import { BaseModel } from '@app/common/base/base.model';
import { Column, Entity, Index } from 'typeorm';

@Entity('setting')
export class SettingModel extends BaseModel {
  @Index({ unique: true })
  @Column({
    name: 'key',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  key: string;

  @Column({
    name: 'value',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  value: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;
}
