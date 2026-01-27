/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1769520947381 {
    name = 'Migration1769520947381'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "notification" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "notification_message" jsonb NOT NULL, "notification_title" jsonb, "notification_type" character varying NOT NULL, "user_id" bigint NOT NULL, "additional_info" jsonb, "is_read" boolean NOT NULL DEFAULT false, "read_at" bigint, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_84ca0c7eb49f62e49a12d830af" ON "notification" ("notification_type", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_222bedeafe7e2d71fa21f6ab6d" ON "notification" ("user_id", "is_read", "is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_1f811ad4af61395e62bfbf8695" ON "notification" ("user_id", "created_at", "is_deleted") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_1f811ad4af61395e62bfbf8695"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_222bedeafe7e2d71fa21f6ab6d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84ca0c7eb49f62e49a12d830af"`);
        await queryRunner.query(`DROP TABLE "notification"`);
    }
}
