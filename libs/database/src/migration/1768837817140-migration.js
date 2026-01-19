/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1768837817140 {
    name = 'Migration1768837817140'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "saved_vendor" ("user_id" bigint NOT NULL, "vendor_id" bigint NOT NULL, CONSTRAINT "PK_083aa34dd7873d5e50eecf6a50c" PRIMARY KEY ("user_id", "vendor_id"))`);
        await queryRunner.query(`CREATE TABLE "saved_event" ("user_id" bigint NOT NULL, "event_id" bigint NOT NULL, CONSTRAINT "PK_8ab1fb1048563de67f12ce9b5ca" PRIMARY KEY ("user_id", "event_id"))`);
        await queryRunner.query(`ALTER TABLE "saved_vendor" ADD CONSTRAINT "FK_6f6b6dacb505e00adc5f11c5fe1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_vendor" ADD CONSTRAINT "FK_b5e96838a6bbb44b809a3d8dbc5" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_event" ADD CONSTRAINT "FK_6ed2a8337605d9597b4be4bef7b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_event" ADD CONSTRAINT "FK_ff72a3841c7e764f287552fe6d2" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "saved_event" DROP CONSTRAINT "FK_ff72a3841c7e764f287552fe6d2"`);
        await queryRunner.query(`ALTER TABLE "saved_event" DROP CONSTRAINT "FK_6ed2a8337605d9597b4be4bef7b"`);
        await queryRunner.query(`ALTER TABLE "saved_vendor" DROP CONSTRAINT "FK_b5e96838a6bbb44b809a3d8dbc5"`);
        await queryRunner.query(`ALTER TABLE "saved_vendor" DROP CONSTRAINT "FK_6f6b6dacb505e00adc5f11c5fe1"`);
        await queryRunner.query(`DROP TABLE "saved_event"`);
        await queryRunner.query(`DROP TABLE "saved_vendor"`);
    }
}
