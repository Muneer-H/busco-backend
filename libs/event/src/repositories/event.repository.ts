import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { EventModel } from '../models/event.entity';

@Injectable()
export class EventRepository extends BaseRepository<EventModel> {
  constructor(
    @InjectRepository(EventModel)
    private eventRepository: Repository<EventModel>,
  ) {
    super(eventRepository);
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
          "event".category_id,
          "event".name,
          "event".start_time,
          "event".geo_location AS event_geo_location,
          thumbnail_image.url AS thumbnail_url,
          ${() => distanceSelect} AS distance_meters,
          ST_SnapToGrid("event".geo_location::geometry, ${params.gridSize}) AS grid_cell,
          CASE WHEN user_interest.user_id IS NULL THEN 0 ELSE 1 END AS interest_score
        FROM "event"
        LEFT JOIN "event_image" AS thumbnail_image
          ON thumbnail_image.event_id = "event".id
          AND thumbnail_image.is_thumbnail = true
          AND thumbnail_image.is_deleted = false
        LEFT JOIN "user_category_interests" AS user_interest
          ON user_interest.category_id = "event".category_id
          AND user_interest.user_id = ${userId}
        WHERE "event".is_deleted = false
          AND "event".is_private = false
          AND "event".geo_location IS NOT NULL
          AND ST_Contains(
            ST_MakeEnvelope(${params.swLng}, ${params.swLat}, ${params.neLng}, ${params.neLat}, 4326),
            "event".geo_location::geometry
          )
          ${() => maxDistanceCondition}
          AND (${categoryIds}::bigint[] IS NULL OR "event".category_id = ANY(${categoryIds}::bigint[]))
          AND (${rangeStart}::timestamp IS NULL OR (
            "event".end_time IS NULL OR "event".end_time >= ${rangeStart}::timestamp
          ))
          AND (${rangeEnd}::timestamp IS NULL OR "event".start_time <= ${rangeEnd}::timestamp)
      ) AS events
      INNER JOIN "event_category" AS category
        ON category.id = events.category_id
      ORDER BY
        grid_cell,
        interest_score DESC,
        start_time ASC,
        id ASC
    `;
  }
}
