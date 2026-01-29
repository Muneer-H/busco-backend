import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimpleRepository } from '@app/common/base/simple.repository';
import { EventRegistrationModel, EventRegistrationStatus } from '../models/event_registration.entity';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';
import { PaginationParam } from '@app/common/base/base.dto';

@Injectable()
export class EventRegistrationRepository extends SimpleRepository<EventRegistrationModel> {
  constructor(
    @InjectRepository(EventRegistrationModel)
    private eventRegistrationRepository: Repository<EventRegistrationModel>,
  ) {
    super(eventRegistrationRepository);
  }

  public async GetEventRegistrations(
    eventId: number,
    params: PaginationParam,
  ) {
    const pagination = GetPaginationOptions(params);

    const [registrations, count] = await this.Repository.findAndCount({
      where: { event_id: eventId, status: EventRegistrationStatus.APPROVED },
      relations: ['user'],
      select: {
        event_id: true,
        user_id: true,
        status: true,
        created_at: true,
        checked_in_at: true,
        user: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image_url: true,
        },
      },
      order: { created_at: 'DESC' },
      take: pagination.limit,
      skip: pagination.offset,
    });

    return { registrations, count };
  }
}
