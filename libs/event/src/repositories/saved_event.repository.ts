import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimpleRepository } from '@app/common/base/simple.repository';
import { SavedEventModel } from '../models/saved_event.entity';

@Injectable()
export class SavedEventRepository extends SimpleRepository<SavedEventModel> {
  constructor(
    @InjectRepository(SavedEventModel)
    private savedEventRepository: Repository<SavedEventModel>,
  ) {
    super(savedEventRepository);
  }

}
