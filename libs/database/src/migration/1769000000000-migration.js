/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1769000000000 {
    name = 'Migration1769000000000'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`
          CREATE TABLE "event_category_map" (
            "event_id" bigint NOT NULL,
            "category_id" bigint NOT NULL,
            "is_primary" boolean NOT NULL DEFAULT false,
            CONSTRAINT "PK_event_category_map" PRIMARY KEY ("event_id", "category_id")
          )
        `);
        await queryRunner.query(`
          ALTER TABLE "event_category_map"
          ADD CONSTRAINT "FK_event_category_map_event"
          FOREIGN KEY ("event_id") REFERENCES "event"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
          ALTER TABLE "event_category_map"
          ADD CONSTRAINT "FK_event_category_map_category"
          FOREIGN KEY ("category_id") REFERENCES "event_category"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
          CREATE UNIQUE INDEX "IDX_event_category_map_primary"
          ON "event_category_map" ("event_id")
          WHERE "is_primary" = true
        `);
        await queryRunner.query(`
          INSERT INTO "event_category_map" ("event_id", "category_id", "is_primary")
          SELECT "id", "category_id", true
          FROM "event"
          WHERE "category_id" IS NOT NULL
        `);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "category_id"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "event" ADD "category_id" bigint`);
        await queryRunner.query(`
          UPDATE "event"
          SET "category_id" = primary_map.category_id
          FROM (
            SELECT "event_id", "category_id"
            FROM "event_category_map"
            WHERE "is_primary" = true
          ) AS primary_map
          WHERE primary_map.event_id = "event".id
        `);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "category_id" SET NOT NULL`);
        await queryRunner.query(`
          ALTER TABLE "event"
          ADD CONSTRAINT "FK_event_category"
          FOREIGN KEY ("category_id") REFERENCES "event_category"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`DROP INDEX "IDX_event_category_map_primary"`);
        await queryRunner.query(`DROP TABLE "event_category_map"`);
    }
}
