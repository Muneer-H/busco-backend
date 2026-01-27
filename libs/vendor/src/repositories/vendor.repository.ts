import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '@app/common/base/base.repository';
import { GetPaginationOptions } from '@app/common/helpers/misc.helper';
import { SETTING_KEYS } from '@app/common/constants/setting_keys.constant';
import type { GetPublicVendorDto } from '../dtos/vendor.dto';
import { VendorModel } from '../models/vendor.entity';
import { UserLocationDto } from '@app/common/base/base.dto';

@Injectable()
export class VendorRepository extends BaseRepository<VendorModel> {
  constructor(
    @InjectRepository(VendorModel)
    private vendorRepository: Repository<VendorModel>,
  ) {
    super(vendorRepository);
  }

  public async GetPublicVendors(query: GetPublicVendorDto) {
    const options = GetPaginationOptions(query);
    const paginationClause =
      options.limit != -1
        ? `LIMIT ${options.limit} OFFSET ${options.offset}`
        : '';
    const searchQuery = query.search_query?.trim() ?? null;
    const foodTypes =
      query.food_type && query.food_type.length ? query.food_type : null;
    const operatingDays =
      query.operating_days && query.operating_days.length
        ? query.operating_days
        : null;
    const neighborhood = query.neighborhood?.trim() ?? null;
    const closesIfRain =
      query.closes_if_rain !== undefined ? query.closes_if_rain : null;

    const rows = await this.Repository.sql`
      WITH settings AS (
        SELECT "setting".value::integer AS default_radius
        FROM "setting"
        WHERE "setting".key = ${SETTING_KEYS.DEFAULT_RADIUS}
        LIMIT 1
      ),
      filtered AS (
        SELECT
          "vendor".*,
          distance_calc.distance_meters
        FROM "vendor"
        CROSS JOIN settings
        CROSS JOIN LATERAL (
          SELECT ST_Distance(
            "vendor".geo_location,
            ST_SetSRID(ST_MakePoint(${query.user_lng}, ${query.user_lat}), 4326)::geography
          )::integer AS distance_meters
        ) AS distance_calc
        WHERE "vendor".is_deleted = false
          AND (${searchQuery}::text IS NULL OR "vendor".name ILIKE '%' || ${searchQuery} || '%')
          AND (${foodTypes}::text[] IS NULL OR "vendor".food_type && ${foodTypes}::text[])
          AND (${operatingDays}::text[] IS NULL OR "vendor".operating_days && ${operatingDays}::text[])
          AND (${neighborhood}::text IS NULL OR "vendor".neighborhood ILIKE '%' || ${neighborhood} || '%')
          AND (${closesIfRain}::boolean IS NULL OR "vendor".closes_if_rain = ${closesIfRain})
          AND (
            settings.default_radius IS NULL
            OR distance_calc.distance_meters <= settings.default_radius
          )
      )
      SELECT
        filtered.id,
        filtered.created_at,
        filtered.created_by,
        filtered.updated_at,
        filtered.updated_by,
        filtered.is_deleted,
        filtered.name,
        filtered.alt_directions,
        filtered.food_type,
        filtered.location_url,
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
        filtered.operating_days,
        filtered.weekday_open_time,
        filtered.weekday_close_time,
        filtered.weekend_open_time,
        filtered.weekend_close_time,
        filtered.closes_if_rain,
        filtered.neighborhood,
        filtered.xano_id,
        filtered.distance_meters,
        COALESCE(images.images, '[]'::json) AS images,
        COUNT(*) OVER()::int AS total_count
      FROM filtered
      LEFT JOIN LATERAL (
        SELECT
          json_build_array(to_jsonb("vendor_image")) AS images
        FROM "vendor_image"
        WHERE "vendor_image".vendor_id = filtered.id
          AND "vendor_image".is_thumbnail = true
          AND "vendor_image".is_deleted = false
        LIMIT 1
      ) AS images ON true
      ORDER BY filtered.distance_meters ASC NULLS LAST, filtered.id ASC
      ${() => paginationClause}
    `;

    const count = rows.length ? Number(rows[0].total_count) : 0;
    const vendors = rows.map(({ total_count, ...vendor }) => vendor);

    return { vendors, count };
  }

  public async GetPublicVendorById(id: number, query: UserLocationDto) {
    const rows = await this.Repository.sql`
      WITH filtered AS (
        SELECT
          "vendor".*,
          distance_calc.distance_meters
        FROM "vendor"
        CROSS JOIN LATERAL (
          SELECT ST_Distance(
            "vendor".geo_location,
            ST_SetSRID(ST_MakePoint(${query.user_lng}, ${query.user_lat}), 4326)::geography
          )::integer AS distance_meters
        ) AS distance_calc
        WHERE "vendor".id = ${id}
          AND "vendor".is_deleted = false
      )
      SELECT
        filtered.id,
        filtered.created_at,
        filtered.created_by,
        filtered.updated_at,
        filtered.updated_by,
        filtered.is_deleted,
        filtered.name,
        filtered.alt_directions,
        filtered.food_type,
        filtered.location_url,
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
        filtered.operating_days,
        filtered.weekday_open_time,
        filtered.weekday_close_time,
        filtered.weekend_open_time,
        filtered.weekend_close_time,
        filtered.closes_if_rain,
        filtered.neighborhood,
        filtered.distance_meters,
        COALESCE(images.images, '[]'::json) AS images
      FROM filtered
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(
            json_agg(to_jsonb("vendor_image") ORDER BY "vendor_image".id ASC),
            '[]'::json
          ) AS images
        FROM "vendor_image"
        WHERE "vendor_image".vendor_id = filtered.id
          AND "vendor_image".is_deleted = false
      ) AS images ON true
    `;

    return rows[0] ?? null;
  }
}
