/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1769527816076 {
    name = 'Migration1769527816076'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "event_registration" ("event_id" bigint NOT NULL, "user_id" bigint NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3a255ec16312cb8399981f15bd" PRIMARY KEY ("event_id", "user_id"))`);
        await queryRunner.query(`ALTER TABLE "event_registration" ADD CONSTRAINT "FK_d42836e8ed00e2586af913934a6" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_registration" ADD CONSTRAINT "FK_2b850bf3117d0f00760dcdef0dd" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "event_registration" DROP CONSTRAINT "FK_2b850bf3117d0f00760dcdef0dd"`);
        await queryRunner.query(`ALTER TABLE "event_registration" DROP CONSTRAINT "FK_d42836e8ed00e2586af913934a6"`);
        await queryRunner.query(`DROP TABLE "event_registration"`);
    }
}
