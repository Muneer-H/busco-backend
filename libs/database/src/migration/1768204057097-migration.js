/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1768204057097 {
    name = 'Migration1768204057097'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "vendor" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "alt_directions" text, "food_type" text array, "location_url" character varying(255), "geo_location" geography(Point,4326), "operating_days" text array, "weekday_open_time" TIME, "weekday_close_time" TIME, "weekend_open_time" TIME, "weekend_close_time" TIME, "closes_if_rain" boolean NOT NULL DEFAULT false, "neighborhood" character varying(255), "xano_id" uuid, CONSTRAINT "PK_931a23f6231a57604f5a0e32780" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4ea5936b210a6d6f72886fa85a" ON "vendor" USING GiST ("geo_location") `);
        await queryRunner.query(`CREATE TABLE "vendor_image" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "vendor_id" bigint NOT NULL, "url" character varying(255) NOT NULL, "is_thumbnail" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_062167877b4eb9e7df0080840e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_image" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "event_id" bigint NOT NULL, "url" character varying(255) NOT NULL, "is_thumbnail" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4b28dce817e9888b5a9c8f301d2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "description" text, "location_name" character varying(255), "address" text, "geo_location" geography(Point,4326), "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP, "category_id" bigint NOT NULL, "allow_ads" boolean NOT NULL DEFAULT false, "is_private" boolean NOT NULL DEFAULT false, "capacity" integer, "require_approval" boolean NOT NULL DEFAULT false, "city" character varying(100), "host_id" bigint, "share_code" character varying(50), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d3f751bb00d0164e4567138e7e" ON "event" USING GiST ("geo_location") `);
        await queryRunner.query(`CREATE INDEX "IDX_baca3ea9ea55009e8330aff61e" ON "event" ("city") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_57824e9738428cef427c75b450" ON "event" ("share_code") `);
        await queryRunner.query(`CREATE TABLE "event_category" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(50) NOT NULL, "description" text, "icon" character varying(255), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_697909a55bde1b28a90560f3ae2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_category_interests" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "user_id" bigint NOT NULL, "category_id" bigint NOT NULL, CONSTRAINT "PK_63d974d8f625088814353970e1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "email" character varying(100), "phone" character varying(20), "image_url" character varying(255), "geo_location" geography(Point,4326), "firebase_uid" character varying(255) NOT NULL, "deleted_at" bigint, CONSTRAINT "email_or_phone_check" CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5d0a309ec6562639e59c289762" ON "user" USING GiST ("geo_location") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_40fe3048b17f675b652c199927" ON "user" ("firebase_uid") `);
        await queryRunner.query(`CREATE TYPE "public"."admin_role_enum" AS ENUM('super_admin', 'admin')`);
        await queryRunner.query(`CREATE TABLE "admin" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."admin_role_enum" NOT NULL DEFAULT 'admin', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_de87485f6489f5d0995f584195" ON "admin" ("email") `);
        await queryRunner.query(`ALTER TABLE "vendor_image" ADD CONSTRAINT "FK_1ecf84aa9dc012de0205da0b8d1" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_image" ADD CONSTRAINT "FK_657bca31b0b6f27e167aa58534b" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_697909a55bde1b28a90560f3ae2" FOREIGN KEY ("category_id") REFERENCES "event_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_42ff6901a665b1c910fb11eead6" FOREIGN KEY ("host_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_category_interests" ADD CONSTRAINT "FK_7f7910208015eee5757cc6753da" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_category_interests" ADD CONSTRAINT "FK_d78e89ece784db6125a685a77e1" FOREIGN KEY ("category_id") REFERENCES "event_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_category_interests" DROP CONSTRAINT "FK_d78e89ece784db6125a685a77e1"`);
        await queryRunner.query(`ALTER TABLE "user_category_interests" DROP CONSTRAINT "FK_7f7910208015eee5757cc6753da"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_42ff6901a665b1c910fb11eead6"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_697909a55bde1b28a90560f3ae2"`);
        await queryRunner.query(`ALTER TABLE "event_image" DROP CONSTRAINT "FK_657bca31b0b6f27e167aa58534b"`);
        await queryRunner.query(`ALTER TABLE "vendor_image" DROP CONSTRAINT "FK_1ecf84aa9dc012de0205da0b8d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de87485f6489f5d0995f584195"`);
        await queryRunner.query(`DROP TABLE "admin"`);
        await queryRunner.query(`DROP TYPE "public"."admin_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_40fe3048b17f675b652c199927"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d0a309ec6562639e59c289762"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "user_category_interests"`);
        await queryRunner.query(`DROP TABLE "event_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57824e9738428cef427c75b450"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_baca3ea9ea55009e8330aff61e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3f751bb00d0164e4567138e7e"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "event_image"`);
        await queryRunner.query(`DROP TABLE "vendor_image"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ea5936b210a6d6f72886fa85a"`);
        await queryRunner.query(`DROP TABLE "vendor"`);
    }
}
