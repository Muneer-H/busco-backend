const { DataSource } = require("typeorm");
const { config } = require("./dist/libs/database/src/database.config");
module.exports = new DataSource(config);
