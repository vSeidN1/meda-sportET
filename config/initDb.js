const db = require("./database");

async function initDb() {
  try {
    console.log("🔄 Initializing and updating database schema...");

    // 1. Check and update 'posts' table
    try {
      const [postsCols] = await db.query("SHOW COLUMNS FROM posts");
      const postColNames = postsCols.map(col => col.Field);

      if (!postColNames.includes("views")) {
        console.log("➕ Adding 'views' column to 'posts' table");
        await db.query("ALTER TABLE posts ADD COLUMN views INT DEFAULT 0");
      }
      if (!postColNames.includes("likes")) {
        console.log("➕ Adding 'likes' column to 'posts' table");
        await db.query("ALTER TABLE posts ADD COLUMN likes INT DEFAULT 0");
      }
      if (!postColNames.includes("author")) {
        console.log("➕ Adding 'author' column to 'posts' table");
        await db.query("ALTER TABLE posts ADD COLUMN author VARCHAR(100) DEFAULT 'MedaSport Admin'");
      }
    } catch (err) {
      console.error("⚠️ Error checking/updating 'posts' table:", err.message);
    }

    // 2. Check and update 'match_highlights' table
    try {
      const [highlightCols] = await db.query("SHOW COLUMNS FROM match_highlights");
      const highlightColNames = highlightCols.map(col => col.Field);

      if (!highlightColNames.includes("views")) {
        console.log("➕ Adding 'views' column to 'match_highlights' table");
        await db.query("ALTER TABLE match_highlights ADD COLUMN views INT DEFAULT 0");
      }
      if (!highlightColNames.includes("likes")) {
        console.log("➕ Adding 'likes' column to 'match_highlights' table");
        await db.query("ALTER TABLE match_highlights ADD COLUMN likes INT DEFAULT 0");
      }
    } catch (err) {
      console.error("⚠️ Error checking/updating 'match_highlights' table:", err.message);
    }

    // 3. Create 'comments' table if it doesn't exist
    try {
      console.log("🔄 Ensuring 'comments' table exists...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NULL,
          highlight_id INT NULL,
          name VARCHAR(100) NOT NULL,
          comment_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (highlight_id) REFERENCES match_highlights(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log("✅ 'comments' table is ready.");
    } catch (err) {
      console.error("❌ Error creating/checking 'comments' table:", err.message);
    }

    console.log("✅ Database schema initialization completed.");
  } catch (err) {
    console.error("❌ Database connection error during initialization:", err);
  }
}

module.exports = initDb;
