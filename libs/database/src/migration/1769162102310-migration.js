/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1769162102310 {
    name = 'Migration1769162102310'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."device_device_type_enum" AS ENUM('ios', 'android', 'web')`);
        await queryRunner.query(`CREATE TABLE "device" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "firebase_token" character varying(500), "device_type" "public"."device_device_type_enum" NOT NULL, "owner_id" bigint, "device_name" character varying(255), "device_model" character varying(100), "os_version" character varying(50), "app_version" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "last_active_at" bigint, "timezone" character varying(50), "user_agent" character varying(255), CONSTRAINT "PK_2dc10972aa4e27c01378dad2c72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c86889bd0dca69c6e9a478b2f2" ON "device" ("owner_id", "is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_a7b851f72e35b3b4584e8ae70e" ON "device" ("firebase_token", "is_deleted") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_a7b851f72e35b3b4584e8ae70e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c86889bd0dca69c6e9a478b2f2"`);
        await queryRunner.query(`DROP TABLE "device"`);
        await queryRunner.query(`DROP TYPE "public"."device_device_type_enum"`);
    }
}
