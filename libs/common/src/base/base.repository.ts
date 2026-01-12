import {
  In,
  Repository,
  UpdateResult,
  DeleteResult,
  FindOptionsWhere,
  ObjectType,
} from 'typeorm';
import { BaseModel } from './base.model';
import { SimpleRepository } from './simple.repository';

export interface PaginationRequestParams {
  limit?: number;
  page?: number;
}

export interface PaginationDBParams {
  limit: number;
  offset: number;
}

export abstract class BaseRepository<
  T extends BaseModel,
> extends SimpleRepository<T> {
  protected Model: ObjectType<T>;
  protected ConnectionName: string;
  protected DefaultOrderByColumn: string = 'id';
  protected DefaultOrderByDirection: string = 'ASC';
  protected PrimaryColumnKey: string = 'id';

  constructor(protected Repository: Repository<T>) {
    super(Repository);
  }

  protected GetPrimaryColumnKey() {
    return this.PrimaryColumnKey;
  }

  protected GetPrimaryColumnValue(val) {
    return val;
  }

  protected InOperator(val): any {
    return In(val);
  }

  protected ApplyOrder(
    whereParams: any,
    orderOptions?: { column: string; direction: 'ASC' | 'DESC' },
  ): any {
    let Column: string = this.DefaultOrderByColumn;
    let Direction: string = this.DefaultOrderByDirection;

    if (orderOptions !== undefined) {
      if (orderOptions.column) {
        Column = orderOptions.column;
      }

      if (orderOptions.direction) {
        Direction = orderOptions.direction;
      }
    }

    if (whereParams.order === undefined) {
      whereParams.order = {};
    }

    whereParams.order[Column] = Direction;

    return whereParams;
  }

  public async Create(instance: Partial<T>, creatorId = null): Promise<T> {
    if (creatorId) {
      instance.created_by = creatorId;
      instance.updated_by = creatorId;
    }

    return await this.Save(instance);
  }

  public async FindById(id?: number | string, params?: any) {
    return await this.Repository.findOne({ where: { id: id }, ...params });
  }

  public async FindByIds(ids: number[]) {
    return await this.Repository.findBy({ id: In(ids) } as any);
  }

  public async Find(
    whereParams,
    options?: PaginationDBParams,
    select?: string[],
  ) {
    let params = {
      where: this.PrepareParams(whereParams),
    };

    params = this.ApplyPagination(params, options);
    params = this.ApplyOrder(params);
    if (select) {
      params['select'] = ['id', ...select];
    }
    return await this.Repository.find(params);
  }

  public async FindAndCount(
    whereParams,
    options?: PaginationDBParams,
    relations?,
  ) {
    let params = {
      where: this.PrepareParams(whereParams),
    };
    params = this.ApplyPagination(params, options);
    params = this.ApplyOrder(params, whereParams.order);
    params = this.ApplyRelations(params, relations);

    return await this.Repository.findAndCount(params as any);
  }

  public async Delete(
    param: any,
    softDelete = true,
  ): Promise<UpdateResult | DeleteResult> {
    if (softDelete) {
      return await this.Repository.update(param, {
        is_deleted: true,
      } as any);
    } else {
      //TODO: We have remove function as well.
      return await super.Delete(param);
    }
  }

  public async DeleteById(
    id: number,
    softDelete = true,
  ): Promise<UpdateResult | DeleteResult> {
    return await this.Delete(
      {
        id: id,
      },
      softDelete,
    );
  }

  public async DeleteByIds(
    ids: number[],
    softDelete = true,
  ): Promise<UpdateResult | DeleteResult> {
    const idList = ids.map((id) => ({ id: id }));

    return await this.Delete(idList, softDelete);
  }

  public async UpdateManyToManyRelation<R extends { id: number | string }>(
    entity: T,
    relationName: string,
    newRelatedEntities: R[],
  ) {
    const currentRelatedEntities = ((entity as any)[relationName] as R[]) || [];

    const newIds = new Set(newRelatedEntities.map((item) => item.id));
    const currentIds = new Set(currentRelatedEntities.map((item) => item.id));

    const toAdd = Array.from(newIds).filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !newIds.has(id));

    if (toAdd.length > 0 || toRemove.length > 0) {
      await this.Repository.createQueryBuilder()
        .relation(this.Model, relationName)
        .of(entity)
        .addAndRemove(toAdd, toRemove);
    }
  }
}
