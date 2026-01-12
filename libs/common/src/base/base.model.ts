import {
  AfterLoad,
  AfterInsert,
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class BaseModel extends BaseEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column({
    name: 'created_at',
    type: 'bigint',
    nullable: true,
  })
  created_at;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true,
  })
  created_by;

  @Column({
    name: 'updated_at',
    type: 'bigint',
    nullable: true,
  })
  updated_at;

  @Column({
    name: 'updated_by',
    type: 'bigint',
    nullable: true,
  })
  updated_by;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  is_deleted: boolean;

  @BeforeInsert()
  createDates() {
    this.created_at = Date.now();
    this.updated_at = Date.now();
    this.is_deleted = false;
  }

  @BeforeUpdate()
  updateDates() {
    this.updated_at = Date.now();
  }

  @AfterInsert()
  castId() {
    this.id = +this.id;
  }

  @AfterLoad()
  convertDates() {
    this.id = +this.id;
  }
}
