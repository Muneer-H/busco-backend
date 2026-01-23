import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository, PaginationDBParams } from '@app/common/base/base.repository';
import { EventModel } from '../models/event.entity';
import { SavedEventModel } from '../models/saved_event.entity';
import { GetEventDto, GetSavedEventDto } from '../dtos/event.dto';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';

@Injectable()
export class EventRepository extends BaseRepository<EventModel> {
  constructor(
    @InjectRepository(EventModel)
    private eventRepository: Repository<EventModel>,
  ) {
    super(eventRepository);
  }

  public async GetEventsWithPrimaryCategory(params: GetEventDto) {
    const pagination = GetPaginationOptions(params);
    const qb = this.Repository.createQueryBuilder('event')
      .select([
        'event',
        'images.id',
        'images.url',
        'host.id',
        'host.name',
        'host.image_url',
        'category_maps',
        'categories.id',
        'categories.name',
        'categories.icon',
      ])
      .leftJoin('event.images', 'images', 'images.is_thumbnail = TRUE')
      .leftJoin('event.host', 'host')
      .innerJoin(
        'event.category_maps',
        'category_maps',
        'category_maps.is_primary = TRUE',
      )
      .innerJoin('category_maps.category', 'categories');

    qb.where('event.is_deleted = false');

    if (params.search_query) {
      qb.andWhere('event.name ILIKE :searchQuery', {
        searchQuery: `%${params.search_query}%`,
      });
    }

    if (params.category_ids?.length) {
      qb.andWhere('categories.id IN (:...categoryIds)', {
        categoryIds: params.category_ids,
      });
    }

    if (params.is_private !== undefined) {
      qb.andWhere('event.is_private = :isPrivate', {
        isPrivate: params.is_private,
      });
    }

    if (params.city) {
      qb.andWhere('event.city = :city', { city: params.city });
    }

    if (params.host_id) {
      qb.andWhere('event.host_id = :hostId', { hostId: params.host_id });
    }

    qb.orderBy('event.id', 'ASC')
      .take(pagination.limit)
      .skip(pagination.offset);

    return await qb.getManyAndCount();
  }

  public async GetSavedEvents(userId: number, query: GetSavedEventDto) {
    const pagination = GetPaginationOptions(query);
    const qb = this.Repository.createQueryBuilder('event')
      .select([
        'event',
        'event_image.id',
        'event_image.url',
        'category_maps',
        'categories.id',
        'categories.name',
        'categories.icon',
        'host.id',
        'host.name',
        'host.image_url',
      ])
      .innerJoin(
        SavedEventModel,
        'saved_event',
        'saved_event.event_id = event.id AND saved_event.user_id = :userId',
        { userId },
      )
      .leftJoinAndSelect(
        'event.images',
        'event_image',
        'event_image.is_thumbnail = true',
      )
      .leftJoin(
        'event.category_maps',
        'category_maps',
        'category_maps.is_primary = TRUE',
      )
      .leftJoin('category_maps.category', 'categories')
      .leftJoinAndSelect('event.host', 'host')
      .where('event.is_deleted = false')
      .orderBy('event.id', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset);

    const [events, count] = await qb.getManyAndCount();

    return { events, count };
  }

  public async GetEventWithCategories(where: {
    id?: number;
    share_code?: string;
  }) {
    const normalizedWhere = Object.fromEntries(
      Object.entries(where).filter(([, value]) => value !== undefined),
    );
    if (!Object.keys(normalizedWhere).length) {
      return null;
    }

    const qb = this.Repository.createQueryBuilder('event')
      .leftJoinAndSelect('event.images', 'images')
      .leftJoinAndSelect('event.host', 'host')
      .leftJoinAndSelect('event.category_maps', 'category_maps')
      .leftJoinAndSelect('category_maps.category', 'category')

    qb.where(normalizedWhere);

    return await qb.getOne();
  }

  public async GetMapViewEvents(params: {
    gridSize: number;
    swLng: number;
    swLat: number;
    neLng: number;
    neLat: number;
    userId?: number | null;
    userLat?: number | null;
    userLng?: number | null;
    maxDistance?: number | null;
    categoryIds?: number[] | null;
    rangeStart?: string | null;
    rangeEnd?: string | null;
  }) {
    const userId = params.userId ?? null;
    const categoryIds = params.categoryIds ?? null;
    const rangeStart = params.rangeStart ?? null;
    const rangeEnd = params.rangeEnd ?? null;

    const distanceSelect =
      params.userLng && params.userLat
        ? `ST_Distance(
        "event".geo_location,
        ST_SetSRID(ST_MakePoint(${params.userLng}, ${params.userLat}), 4326)::geography
      )::integer`
        : 'NULL';

    const maxDistanceCondition =
      params.userLng && params.userLat && params.maxDistance
        ? `AND 
      ${distanceSelect} <= ${params.maxDistance}
    `
        : '';

    return await this.Repository.sql`
      SELECT DISTINCT ON (grid_cell)
        events.id,
        events.name,
        events.start_time,
        events.distance_meters,
        json_build_object(
          'type',
          'Point',
          'coordinates',
          ARRAY[
            ST_X(events.event_geo_location::geometry),
            ST_Y(events.event_geo_location::geometry)
          ]
        ) AS geo_location,
        events.thumbnail_url,
        json_build_object('id', category.id, 'name', category.name, 'icon', category.icon) AS category
      FROM (
        SELECT
          "event".id,
          primary_category_map.category_id AS primary_category_id,
          "event".name,
          "event".start_time,
          "event".geo_location AS event_geo_location,
          thumbnail_image.url AS thumbnail_url,
          ${() => distanceSelect} AS distance_meters,
          ST_SnapToGrid("event".geo_location::geometry, ${params.gridSize}) AS grid_cell,
          CASE WHEN user_interest.user_id IS NULL THEN 0 ELSE 1 END AS interest_score
        FROM "event"
        LEFT JOIN "event_category_map" AS primary_category_map
          ON primary_category_map.event_id = "event".id
          AND primary_category_map.is_primary = true
        LEFT JOIN "event_image" AS thumbnail_image
          ON thumbnail_image.event_id = "event".id
          AND thumbnail_image.is_thumbnail = true
          AND thumbnail_image.is_deleted = false
        LEFT JOIN "user_category_interests" AS user_interest
          ON user_interest.category_id = primary_category_map.category_id
          AND user_interest.user_id = ${userId}
        WHERE "event".is_deleted = false
          AND "event".is_private = false
          AND "event".geo_location IS NOT NULL
          AND ST_Contains(
            ST_MakeEnvelope(${params.swLng}, ${params.swLat}, ${params.neLng}, ${params.neLat}, 4326),
            "event".geo_location::geometry
          )
          ${() => maxDistanceCondition}
          AND (
            ${categoryIds}::bigint[] IS NULL
            OR EXISTS (
              SELECT 1
              FROM "event_category_map" AS filter_map
              WHERE filter_map.event_id = "event".id
                AND filter_map.category_id = ANY(${categoryIds}::bigint[])
            )
          )
          AND (${rangeStart}::timestamp IS NULL OR (
            "event".end_time IS NULL OR "event".end_time >= ${rangeStart}::timestamp
          ))
          AND (${rangeEnd}::timestamp IS NULL OR "event".start_time <= ${rangeEnd}::timestamp)
      ) AS events
      INNER JOIN "event_category" AS category
        ON category.id = events.primary_category_id
      ORDER BY
        grid_cell,
        interest_score DESC,
        start_time ASC,
        id ASC
    `;
  }
}
