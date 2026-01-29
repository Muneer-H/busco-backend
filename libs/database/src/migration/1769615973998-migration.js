/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1769615973998 {
    name = 'Migration1769615973998'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "event_registration" ADD "checked_in_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "event" ADD "registration_open" BOOLEAN NOT NULL DEFAULT TRUE`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "event_registration" DROP COLUMN "checked_in_at"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "registration_open"`);
    }
}
