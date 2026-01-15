/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1768468714796 {
    name = 'Migration1768468714796'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vendor_image" DROP CONSTRAINT "FK_1ecf84aa9dc012de0205da0b8d1"`);
        await queryRunner.query(`CREATE TABLE "setting" ("id" BIGSERIAL NOT NULL, "created_at" bigint, "created_by" bigint, "updated_at" bigint, "updated_by" bigint, "is_deleted" boolean NOT NULL DEFAULT false, "key" character varying(255) NOT NULL, "value" character varying(255) NOT NULL, "description" text, CONSTRAINT "PK_fcb21187dc6094e24a48f677bed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1c4c95d773004250c157a744d6" ON "setting" ("key") `);
        await queryRunner.query(`ALTER TABLE "vendor_image" ADD CONSTRAINT "FK_1ecf84aa9dc012de0205da0b8d1" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vendor_image" DROP CONSTRAINT "FK_1ecf84aa9dc012de0205da0b8d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c4c95d773004250c157a744d6"`);
        await queryRunner.query(`DROP TABLE "setting"`);
        await queryRunner.query(`ALTER TABLE "vendor_image" ADD CONSTRAINT "FK_1ecf84aa9dc012de0205da0b8d1" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
