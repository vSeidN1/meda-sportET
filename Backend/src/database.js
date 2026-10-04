const mysql = require("mysql2/promise");
const fs = require("node:fs/promises");
const path = require("node:path");

const databaseName = process.env.DB_NAME || "medasport";
if (!/^[A-Za-z0-9_]+$/.test(databaseName))
  throw new Error("DB_NAME may contain only letters, numbers and underscores.");
const baseConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
let pool;

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    ...baseConfig,
    multipleStatements: true,
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${databaseName}\``);
    const schemaPath = path.join(__dirname, "..", "schema.sql");
    let schema = await fs.readFile(schemaPath, "utf8");
    schema = schema.replace(
      /^CREATE DATABASE IF NOT EXISTS medasport[^;]*;\s*USE medasport;\s*/i,
      "",
    );
    await connection.query(schema);
    const indexStatements = [
      "CREATE UNIQUE INDEX uq_standings_league_club ON standings (league, club_name)",
      "CREATE UNIQUE INDEX uq_scorers_league_player ON scorers (league, player_name)",
      "CREATE UNIQUE INDEX uq_assists_league_player ON assists (league, player_name)",
      "CREATE UNIQUE INDEX uq_keepers_league_player ON keepers (league, player_name)",
    ];
    for (const statement of indexStatements) {
      try {
        await connection.query(statement);
      } catch (error) {
        const message = String(error.message || "");
        if (!/already exists|Duplicate key name|index.*exists/i.test(message)) {
          throw error;
        }
      }
    }
  } finally {
    await connection.end();
  }
  pool = mysql.createPool({ ...baseConfig, database: databaseName });
  return pool;
}

function query(...args) {
  if (!pool) throw new Error("Database has not been initialized.");
  return pool.query(...args);
}

async function close() {
  if (pool) await pool.end();
}

module.exports = { initializeDatabase, query, close };
