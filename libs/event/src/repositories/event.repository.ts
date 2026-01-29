import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { EventModel } from '../models/event.entity';
import { SavedEventModel } from '../models/saved_event.entity';
import { GetEventDto, GetSavedEventDto } from '../dtos/event.dto';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';
import { SETTING_KEYS } from '@app/common/constants/setting_keys.constant';
import { PaginationParam } from '@app/common/base/base.dto';

@Injectable()
export class EventRepository extends BaseRepository<EventModel> {
  constructor(
    @InjectRepository(EventModel)
    private eventRepository: Repository<EventModel>,
  ) {
    super(eventRepository);
  }

  public async GetEvents(params: GetEventDto, userId?: number | null) {
    const pagination = GetPaginationOptions(params);
    const paginationClause =
      pagination.limit != -1
        ? `LIMIT ${pagination.limit} OFFSET ${pagination.offset}`
        : '';

    const searchQuery = params.search_query?.trim() ?? null;
    const categoryIds = params.category_ids?.length
      ? params.category_ids
      : null;
    const isPrivate =
      params.is_private !== undefined ? params.is_private : null;
    const city = params.city?.trim() ?? null;
    const hostId = params.host_id;
    const userLat = params.user_lat ?? null;
    const userLng = params.user_lng ?? null;
    const rangeStart = params.date_range?.start ?? null;
    const rangeEnd = params.date_range?.end ?? null;

    const rows = await this.Repository.sql`
      WITH settings AS (
        SELECT "setting".value::integer AS default_radius
        FROM "setting"
        WHERE "setting".key = ${SETTING_KEYS.DEFAULT_RADIUS}
        LIMIT 1
      ),
      filtered AS (
        SELECT
          "event".*,
          distance_calc.distance_meters,
          CASE WHEN user_interest.user_id IS NULL THEN 0 ELSE 1 END AS interest_score
        FROM "event"
        CROSS JOIN settings
        CROSS JOIN LATERAL (
          SELECT ST_Distance(
            "event".geo_location,
            ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
          )::integer AS distance_meters
        ) AS distance_calc
        LEFT JOIN "event_category_map" AS primary_category_map
          ON primary_category_map.event_id = "event".id
          AND primary_category_map.is_primary = true
        LEFT JOIN "user_category_interests" AS user_interest
          ON user_interest.category_id = primary_category_map.category_id
          AND user_interest.user_id = ${userId ?? null}
        WHERE "event".is_deleted = false
          AND (${searchQuery}::text IS NULL OR "event".name ILIKE '%' || ${searchQuery} || '%')
          AND (${isPrivate}::boolean IS NULL OR "event".is_private = ${isPrivate})
          AND (${city}::text IS NULL OR "event".city = ${city})
          AND (
            ${hostId === undefined}::boolean
            OR (${hostId === 0}::boolean AND "event".host_id IS NULL)
            OR (${(hostId ?? 0) > 0}::boolean AND "event".host_id = ${hostId}::bigint)
          )
          AND (
            ${categoryIds}::bigint[] IS NULL
            OR EXISTS (
              SELECT 1
              FROM "event_category_map" AS filter_map
              WHERE filter_map.event_id = "event".id
                AND filter_map.category_id = ANY(${categoryIds}::bigint[])
            )
          )
          AND (
            settings.default_radius IS NULL
            OR distance_calc.distance_meters IS NULL
            OR distance_calc.distance_meters <= settings.default_radius
          )
          AND (${rangeStart}::timestamp IS NULL OR (
            "event".end_time IS NULL OR "event".end_time >= ${rangeStart}::timestamp
          ))
          AND (${rangeEnd}::timestamp IS NULL OR "event".start_time <= ${rangeEnd}::timestamp)
      )
      SELECT
        filtered.id::integer,
        filtered.created_at,
        filtered.created_by,
        filtered.updated_at,
        filtered.updated_by,
        filtered.is_deleted,
        filtered.name,
        filtered.description,
        filtered.location_name,
        filtered.address,
        CASE
          WHEN filtered.geo_location IS NULL THEN NULL
          ELSE json_build_object(
            'type',
            'Point',
            'coordinates',
            ARRAY[
              ST_X(filtered.geo_location::geometry),
              ST_Y(filtered.geo_location::geometry)
            ]
          )
        END AS geo_location,
        filtered.start_time,
        filtered.end_time,
        filtered.allow_ads,
        filtered.is_private,
        filtered.capacity,
        filtered.require_approval,
        filtered.city,
        filtered.host_id,
        filtered.share_code,
        filtered.distance_meters,
        json_build_array(
          json_build_object(
            'is_primary', true,
            'category', json_build_object(
              'id', category.id,
              'name', category.name,
              'icon', category.icon
            )
          )
        ) AS category_maps,
        COALESCE(images.images, '[]'::json) AS images,
        COUNT(*) OVER()::int AS total_count
      FROM filtered
      LEFT JOIN "event_category_map" AS primary_map 
        ON primary_map.event_id = filtered.id AND primary_map.is_primary = true
      LEFT JOIN "event_category" AS category ON category.id = primary_map.category_id
      LEFT JOIN LATERAL (
        SELECT
          json_agg(to_jsonb("event_image")) AS images
        FROM "event_image"
        WHERE "event_image".event_id = filtered.id
          AND "event_image".is_thumbnail = true
          AND "event_image".is_deleted = false
        LIMIT 1
      ) AS images ON true
      ORDER BY 
        CASE WHEN ${userLat}::float IS NOT NULL AND ${userLng}::float IS NOT NULL 
             THEN filtered.distance_meters END ASC NULLS LAST,
        filtered.interest_score DESC,
        filtered.id ASC
      ${() => paginationClause}
    `;

    const count = rows.length ? Number(rows[0].total_count) : 0;
    const events = rows.map(({ total_count, ...event }) => event);

    return [events, count];
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
      .orderBy('event.id', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset);

    const [events, count] = await qb.getManyAndCount();

    return { events, count };
  }

  public async GetHostedEvents(userId: number, params: PaginationParam) {
    const pagination = GetPaginationOptions(params);
    const qb = this.Repository.createQueryBuilder('event')
      .select([
        'event',
        'event.saved_count',
        'event.registered_count',
        'event_image.id',
        'event_image.url',
        'event_image.is_thumbnail',
      ])
      .innerJoin('event.host', 'host', 'host.id = :userId', { userId })
      .leftJoin(
        'event.images',
        'event_image',
        'event_image.is_thumbnail = true',
      )
      .orderBy('event.id', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset);

    const [events, count] = await qb.getManyAndCount();

    return { events, count };
  }

  public async GetRegisteredEvents(
    userId: number,
    params: PaginationParam,
    isCheckedIn?: boolean,
  ) {
    const pagination = GetPaginationOptions(params);

    const qb = this.Repository.createQueryBuilder('event')
      .select([
        'event',
        'event_image.id',
        'event_image.url',
        'event_image.is_thumbnail',
        'registrations.status',
        'registrations.created_at',
        'category_maps',
        'categories.id',
        'categories.name',
        'categories.icon',
      ])
      .leftJoin(
        'event.images',
        'event_image',
        'event_image.is_thumbnail = true',
      )
      .innerJoin(
        'event.registrations',
        'registrations',
        'registrations.user_id = :userId',
        { userId },
      )
      .innerJoin(
        'event.category_maps',
        'category_maps',
        'category_maps.is_primary = TRUE',
      )
      .leftJoin('category_maps.category', 'categories')
      .where('1=1');

    if (isCheckedIn !== undefined) {
      qb.andWhere('registrations.checked_in_at IS NOT NULL');
    }

    qb.orderBy('registrations.created_at', 'DESC')
      .take(pagination.limit)
      .skip(pagination.offset);

    const [events, count] = await qb.getManyAndCount();

    return { events, count };
  }

  public async GetEventByIdOrShareCode(where: {
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
      .leftJoinAndSelect('category_maps.category', 'category');

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
