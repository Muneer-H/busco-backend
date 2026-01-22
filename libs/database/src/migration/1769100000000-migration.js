/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class Migration1769100000000 {
    name = 'Migration1769100000000'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "about" character varying(1000)`);
        await queryRunner.query(`
          CREATE TABLE "user_follow" (
            "follower_id" bigint NOT NULL,
            "followee_id" bigint NOT NULL,
            "followed_at" bigint NOT NULL
              DEFAULT CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS bigint),
            CONSTRAINT "PK_user_follow" PRIMARY KEY ("follower_id", "followee_id")
          )
        `);
        await queryRunner.query(`
          ALTER TABLE "user_follow"
          ADD CONSTRAINT "FK_user_follow_follower"
          FOREIGN KEY ("follower_id") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
          ALTER TABLE "user_follow"
          ADD CONSTRAINT "FK_user_follow_followee"
          FOREIGN KEY ("followee_id") REFERENCES "user"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(
          `CREATE INDEX "IDX_user_follow_follower" ON "user_follow" ("follower_id")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_user_follow_followee" ON "user_follow" ("followee_id")`,
        );
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_user_follow_followee"`);
        await queryRunner.query(`DROP INDEX "IDX_user_follow_follower"`);
        await queryRunner.query(
          `ALTER TABLE "user_follow" DROP CONSTRAINT "FK_user_follow_followee"`,
        );
        await queryRunner.query(
          `ALTER TABLE "user_follow" DROP CONSTRAINT "FK_user_follow_follower"`,
        );
        await queryRunner.query(`DROP TABLE "user_follow"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "about"`);
    }
}
