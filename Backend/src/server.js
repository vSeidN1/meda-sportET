require("dotenv").config();
const express = require("express");
const session = require("express-session");
const nodemailer = require("nodemailer");
const path = require("node:path");
const fs = require("node:fs");
const { initializeDatabase, query, close } = require("./database");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEVELOPMENT_SESSION_SECRET =
  "local-development-secret-change-before-deploying";
const sessionSecret = process.env.SESSION_SECRET?.trim();
if (
  process.env.NODE_ENV === "production" &&
  (!sessionSecret ||
    sessionSecret.length < 32 ||
    sessionSecret === DEVELOPMENT_SESSION_SECRET)
) {
  throw new Error(
    "Production requires a SESSION_SECRET of at least 32 characters.",
  );
}
const FRONTEND_DIST = path.resolve(__dirname, "../../Frontend/dist");
const LEAGUES = {
  epl: "Premier League",
  laliga: "La Liga",
  calcio: "Serie A",
  bundesliga: "Bundesliga",
  ligue1: "Ligue 1",
  ucl: "Champions League",
  uel: "Europa League",
};
const STAT_TABLES = [
  "titles",
  "standings",
  "scorers",
  "assists",
  "hattricks",
  "freekicks",
  "keepers",
];

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(
  session({
    name: "medasport.sid",
    secret: sessionSecret || DEVELOPMENT_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
const parseId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0 ? Number(value) : null;
const cleanText = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
const notFound = (res, label) =>
  res.status(404).json({ error: `${label} not found.` });
function requireAdmin(type) {
  return (req, res, next) => {
    if (req.session.adminType !== type)
      return res
        .status(401)
        .json({ error: "Please sign in to the correct newsroom account." });
    next();
  };
}
function configuredCredentials(type) {
  if (type === "posts")
    return {
      username: process.env.ADMIN_POST_USERNAME,
      password: process.env.ADMIN_POST_PASSWORD,
    };
  return {
    username: process.env.ADMIN_HIGHLIGHT_USERNAME,
    password: process.env.ADMIN_HIGHLIGHT_PASSWORD,
  };
}
function equalSecret(provided = "", expected = "") {
  const crypto = require("node:crypto");
  const left = Buffer.from(String(provided));
  const right = Buffer.from(String(expected));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function createEmailTransport() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  const host = process.env.EMAIL_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure =
    String(process.env.EMAIL_SECURE ?? "true").toLowerCase() === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get(
  "/api/posts",
  asyncRoute(async (req, res) => {
    const requestedPage = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 6),
    );
    const [all] = await query(`
      SELECT p.*, COUNT(c.id) AS comments_count
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);
    const featured = [];
    const remainder = [];
    for (const post of all) {
      post.comments_count = Number(post.comments_count || 0);
      post.liked = Boolean(req.session.likedPosts?.[post.id]);
      if (
        ["Breaking News", "Injury Update", "Transfer"].includes(
          post.category,
        ) &&
        featured.length < 3
      )
        featured.push(post);
      else remainder.push(post);
    }
    const totalPages = Math.max(1, Math.ceil(remainder.length / limit));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;
    res.json({
      featured,
      posts: remainder.slice(offset, offset + limit),
      page,
      totalPages,
      total: remainder.length,
    });
  }),
);

app.get(
  "/api/admin/posts",
  requireAdmin("posts"),
  asyncRoute(async (req, res) => {
    const [posts] = await query("SELECT * FROM posts ORDER BY id DESC");
    res.json(posts);
  }),
);

app.get(
  "/api/posts/:id",
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Article");
    await query("UPDATE posts SET views = views + 1 WHERE id = ?", [id]);
    const [[post]] = await query("SELECT * FROM posts WHERE id = ?", [id]);
    if (!post) return notFound(res, "Article");
    const [comments] = await query(
      "SELECT id, name, comment_text, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC",
      [id],
    );
    post.liked = Boolean(req.session.likedPosts?.[id]);
    res.json({ ...post, comments });
  }),
);

app.post(
  "/api/posts/:id/like",
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Article");
    const [[post]] = await query("SELECT id FROM posts WHERE id = ?", [id]);
    if (!post) return notFound(res, "Article");
    req.session.likedPosts ||= {};
    const liked = Boolean(req.session.likedPosts[id]);
    await query(
      liked
        ? "UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ?"
        : "UPDATE posts SET likes = likes + 1 WHERE id = ?",
      [id],
    );
    if (liked) delete req.session.likedPosts[id];
    else req.session.likedPosts[id] = true;
    const [[updated]] = await query("SELECT likes FROM posts WHERE id = ?", [
      id,
    ]);
    res.json({ success: true, likes: updated.likes, liked: !liked });
  }),
);

app.post(
  "/api/posts/:id/comments",
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Article");

    const name = cleanText(req.body.name, 100);
    const comment = cleanText(req.body.comment_text, 3000);

    if (!name || !comment)
      return res.status(400).json({ error: "Name and comment are required." });
    const [[post]] = await query("SELECT id FROM posts WHERE id = ?", [id]);
    if (!post) return notFound(res, "Article");
    const [result] = await query(
      "INSERT INTO comments (post_id, name, comment_text) VALUES (?, ?, ?)",
      [id, name, comment],
    );
    const [[saved]] = await query(
      "SELECT id, name, comment_text, created_at FROM comments WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json({ comment: saved });
  }),
);

app.put(
  "/api/posts/:id/comments/:commentId",
  asyncRoute(async (req, res) => {
    const postId = parseId(req.params.id);
    const commentId = parseId(req.params.commentId);
    if (!postId) return notFound(res, "Article");
    if (!commentId) return notFound(res, "Comment");

    const incomingName = cleanText(req.body.name, 100);
    const comment = cleanText(req.body.comment_text, 3000);
    if (!comment) {
      return res.status(400).json({ error: "Comment text is required." });
    }

    const [[existing]] = await query(
      "SELECT id, name FROM comments WHERE id = ? AND post_id = ?",
      [commentId, postId],
    );
    if (!existing) return notFound(res, "Comment");
    if (
      incomingName &&
      incomingName.toLowerCase() !== existing.name.toLowerCase()
    ) {
      return res
        .status(403)
        .json({ error: "You can only edit your own comment." });
    }

    await query("UPDATE comments SET comment_text = ? WHERE id = ?", [
      comment,
      commentId,
    ]);
    const [[updated]] = await query(
      "SELECT id, name, comment_text, created_at FROM comments WHERE id = ?",
      [commentId],
    );
    res.json({ comment: updated });
  }),
);

app.delete(
  "/api/posts/:id/comments/:commentId",
  asyncRoute(async (req, res) => {
    const postId = parseId(req.params.id);
    const commentId = parseId(req.params.commentId);
    if (!postId) return notFound(res, "Article");
    if (!commentId) return notFound(res, "Comment");

    const incomingName = cleanText(req.body.name, 100);
    const [[existing]] = await query(
      "SELECT id, name FROM comments WHERE id = ? AND post_id = ?",
      [commentId, postId],
    );
    if (!existing) return notFound(res, "Comment");
    if (
      incomingName &&
      incomingName.toLowerCase() !== existing.name.toLowerCase()
    ) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comment." });
    }

    await query("DELETE FROM comments WHERE id = ?", [commentId]);
    res.json({ success: true });
  }),
);

app.get(
  "/api/highlights",
  asyncRoute(async (req, res) => {
    const [items] = await query(`
      SELECT h.*, COUNT(c.id) AS comments_count
      FROM match_highlights h
      LEFT JOIN comments c ON c.highlight_id = h.id
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `);
    res.json(
      items.map((item) => ({
        ...item,
        comments_count: Number(item.comments_count || 0),
      })),
    );
  }),
);
app.get(
  "/api/highlights/:id",
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Highlight");
    await query("UPDATE match_highlights SET views = views + 1 WHERE id = ?", [
      id,
    ]);
    const [[highlight]] = await query(
      "SELECT * FROM match_highlights WHERE id = ?",
      [id],
    );
    if (!highlight) return notFound(res, "Highlight");
    const [comments] = await query(
      "SELECT id, name, comment_text, created_at FROM comments WHERE highlight_id = ? ORDER BY created_at DESC",
      [id],
    );
    highlight.liked = Boolean(req.session.likedHighlights?.[id]);
    res.json({ ...highlight, comments });
  }),
);
app.post(
  "/api/highlights/:id/like",
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Highlight");
    const [[item]] = await query(
      "SELECT id FROM match_highlights WHERE id = ?",
      [id],
    );
    if (!item) return notFound(res, "Highlight");
    req.session.likedHighlights ||= {};
    const liked = Boolean(req.session.likedHighlights[id]);
    await query(
      liked
        ? "UPDATE match_highlights SET likes = GREATEST(0, likes - 1) WHERE id = ?"
        : "UPDATE match_highlights SET likes = likes + 1 WHERE id = ?",
      [id],
    );
    if (liked) delete req.session.likedHighlights[id];
    else req.session.likedHighlights[id] = true;
    const [[updated]] = await query(
      "SELECT likes FROM match_highlights WHERE id = ?",
      [id],
    );
    res.json({ success: true, likes: updated.likes, liked: !liked });
  }),
);
app.post(
  "/api/highlights/:id/comments",
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Highlight");
    const name = cleanText(req.body.name, 100);
    const comment = cleanText(req.body.comment_text, 3000);
    if (!name || !comment)
      return res.status(400).json({ error: "Name and comment are required." });
    const [[item]] = await query(
      "SELECT id FROM match_highlights WHERE id = ?",
      [id],
    );
    if (!item) return notFound(res, "Highlight");
    const [result] = await query(
      "INSERT INTO comments (highlight_id, name, comment_text) VALUES (?, ?, ?)",
      [id, name, comment],
    );
    const [[saved]] = await query(
      "SELECT id, name, comment_text, created_at FROM comments WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json({ comment: saved });
  }),
);

app.put(
  "/api/highlights/:id/comments/:commentId",
  asyncRoute(async (req, res) => {
    const highlightId = parseId(req.params.id);
    const commentId = parseId(req.params.commentId);
    if (!highlightId) return notFound(res, "Highlight");
    if (!commentId) return notFound(res, "Comment");

    const incomingName = cleanText(req.body.name, 100);
    const comment = cleanText(req.body.comment_text, 3000);
    if (!comment) {
      return res.status(400).json({ error: "Comment text is required." });
    }

    const [[existing]] = await query(
      "SELECT id, name FROM comments WHERE id = ? AND highlight_id = ?",
      [commentId, highlightId],
    );
    if (!existing) return notFound(res, "Comment");
    if (
      incomingName &&
      incomingName.toLowerCase() !== existing.name.toLowerCase()
    ) {
      return res
        .status(403)
        .json({ error: "You can only edit your own comment." });
    }

    await query("UPDATE comments SET comment_text = ? WHERE id = ?", [
      comment,
      commentId,
    ]);
    const [[updated]] = await query(
      "SELECT id, name, comment_text, created_at FROM comments WHERE id = ?",
      [commentId],
    );
    res.json({ comment: updated });
  }),
);

app.delete(
  "/api/highlights/:id/comments/:commentId",
  asyncRoute(async (req, res) => {
    const highlightId = parseId(req.params.id);
    const commentId = parseId(req.params.commentId);
    if (!highlightId) return notFound(res, "Highlight");
    if (!commentId) return notFound(res, "Comment");

    const incomingName = cleanText(req.body.name, 100);
    const [[existing]] = await query(
      "SELECT id, name FROM comments WHERE id = ? AND highlight_id = ?",
      [commentId, highlightId],
    );
    if (!existing) return notFound(res, "Comment");
    if (
      incomingName &&
      incomingName.toLowerCase() !== existing.name.toLowerCase()
    ) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comment." });
    }

    await query("DELETE FROM comments WHERE id = ?", [commentId]);
    res.json({ success: true });
  }),
);

app.get(
  "/api/competitions/:slug",
  asyncRoute(async (req, res) => {
    const league = LEAGUES[req.params.slug];
    if (!league) return notFound(res, "Competition");
    const results = await Promise.all(
      STAT_TABLES.map(async (table) => {
        const [rows] = await query(
          table === "titles"
            ? "SELECT * FROM titles WHERE league = ? ORDER BY titles DESC, club_name ASC"
            : table === "standings"
              ? "SELECT * FROM standings WHERE league = ? ORDER BY position ASC"
              : `SELECT * FROM ${table} WHERE league = ? ORDER BY ${
                  table === "scorers"
                    ? "goals"
                    : table === "assists"
                      ? "assists"
                      : table === "hattricks"
                        ? "hattricks"
                        : table === "freekicks"
                          ? "freekick_goals"
                          : "clean_sheets"
                } DESC`,
          [league],
        );
        return rows || [];
      }),
    );
    const records = Object.fromEntries(
      STAT_TABLES.map((table, index) => [table, results[index] || []]),
    );
    res.json({ league, ...records });
  }),
);

app.get(
  "/api/search",
  asyncRoute(async (req, res) => {
    const term = cleanText(req.query.q, 120);
    if (!term) return res.json({ query: "", news: [], highlights: [] });
    const pattern = `%${term}%`;
    const [news] = await query(
      `SELECT p.*, COUNT(c.id) AS comments_count
       FROM posts p
       LEFT JOIN comments c ON c.post_id = p.id
       WHERE p.title LIKE ? OR p.summary LIKE ? OR p.category LIKE ?
       GROUP BY p.id
       ORDER BY p.id DESC
       LIMIT 100`,
      [pattern, pattern, pattern],
    );
    const [highlights] = await query(
      `SELECT h.*, COUNT(c.id) AS comments_count
       FROM match_highlights h
       LEFT JOIN comments c ON c.highlight_id = h.id
       WHERE h.title LIKE ? OR h.description LIKE ?
       GROUP BY h.id
       ORDER BY h.created_at DESC
       LIMIT 100`,
      [pattern, pattern],
    );
    res.json({
      query: term,
      news: news.map((item) => ({
        ...item,
        comments_count: Number(item.comments_count || 0),
        liked: Boolean(req.session.likedPosts?.[item.id]),
      })),
      highlights: highlights.map((item) => ({
        ...item,
        comments_count: Number(item.comments_count || 0),
      })),
    });
  }),
);

app.get("/api/admin/me", (req, res) =>
  res.json({
    authenticated: Boolean(req.session.adminType),
    type: req.session.adminType || null,
  }),
);
app.post("/api/admin/login", (req, res) => {
  const type = req.body.type;
  if (!["posts", "highlights"].includes(type))
    return res.status(400).json({ error: "Choose a valid newsroom." });
  const expected = configuredCredentials(type);
  if (!expected.username || !expected.password)
    return res
      .status(503)
      .json({ error: "Admin credentials are not configured on the server." });
  if (
    !equalSecret(req.body.username, expected.username) ||
    !equalSecret(req.body.password, expected.password)
  )
    return res.status(401).json({ error: "Incorrect username or password." });
  req.session.regenerate((err) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Unable to start a secure session." });
    req.session.adminType = type;
    res.json({ authenticated: true, type });
  });
});
app.post("/api/admin/logout", (req, res) =>
  req.session.destroy((err) =>
    err
      ? res.status(500).json({ error: "Unable to sign out." })
      : res.clearCookie("medasport.sid").json({ success: true }),
  ),
);

app.post(
  "/api/admin/posts",
  requireAdmin("posts"),
  asyncRoute(async (req, res) => {
    const { title, image, summary, category, author } = req.body;
    const values = [
      cleanText(title, 240),
      cleanText(image, 2048) || null,
      cleanText(summary, 30000),
      cleanText(category, 80) || "Other Sports",
      cleanText(author, 100) || "MedaSport Admin",
    ];
    if (!values[0] || !values[2])
      return res
        .status(400)
        .json({ error: "Title and story content are required." });
    const [result] = await query(
      "INSERT INTO posts (title, image, summary, category, author) VALUES (?, ?, ?, ?, ?)",
      values,
    );
    const [[post]] = await query("SELECT * FROM posts WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(post);
  }),
);
app.put(
  "/api/admin/posts/:id",
  requireAdmin("posts"),
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Article");
    const { title, image, summary, category, author } = req.body;
    const values = [
      cleanText(title, 240),
      cleanText(image, 2048) || null,
      cleanText(summary, 30000),
      cleanText(category, 80) || "Other Sports",
      cleanText(author, 100) || "MedaSport Admin",
      id,
    ];
    if (!values[0] || !values[2])
      return res
        .status(400)
        .json({ error: "Title and story content are required." });
    const [result] = await query(
      "UPDATE posts SET title = ?, image = ?, summary = ?, category = ?, author = ? WHERE id = ?",
      values,
    );
    if (!result.affectedRows) return notFound(res, "Article");
    const [[post]] = await query("SELECT * FROM posts WHERE id = ?", [id]);
    res.json(post);
  }),
);
app.delete(
  "/api/admin/posts/:id",
  requireAdmin("posts"),
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Article");
    const [result] = await query("DELETE FROM posts WHERE id = ?", [id]);
    if (!result.affectedRows) return notFound(res, "Article");
    res.json({ success: true });
  }),
);
app.post(
  "/api/admin/highlights",
  requireAdmin("highlights"),
  asyncRoute(async (req, res) => {
    const title = cleanText(req.body.title, 240);
    const link = cleanText(req.body.youtube_link, 2048);
    const description = cleanText(req.body.description, 3000);
    let parsed;
    try {
      parsed = new URL(link);
    } catch {
      return res.status(400).json({ error: "Enter a valid YouTube URL." });
    }
    if (
      !title ||
      ![
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
      ].includes(parsed.hostname)
    )
      return res
        .status(400)
        .json({ error: "A title and YouTube video URL are required." });
    const [result] = await query(
      "INSERT INTO match_highlights (title, youtube_link, description) VALUES (?, ?, ?)",
      [title, link, description],
    );
    const [[item]] = await query(
      "SELECT * FROM match_highlights WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json(item);
  }),
);
app.delete(
  "/api/admin/highlights/:id",
  requireAdmin("highlights"),
  asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return notFound(res, "Highlight");
    const [result] = await query("DELETE FROM match_highlights WHERE id = ?", [
      id,
    ]);
    if (!result.affectedRows) return notFound(res, "Highlight");
    res.json({ success: true });
  }),
);

app.post(
  "/api/contact",
  asyncRoute(async (req, res) => {
    const name = cleanText(req.body.name, 100);
    const email = cleanText(req.body.email, 254);
    const message = cleanText(req.body.message, 5000);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res
        .status(400)
        .json({ error: "Enter your name, a valid email and a message." });

    const smtpUser = process.env.EMAIL_USER?.trim();
    const smtpPass = process.env.EMAIL_PASS?.trim();
    if (!smtpUser || !smtpPass) {
      return res.status(503).json({
        error:
          "Contact email is not configured yet. Add your Gmail address and app password to Backend/.env, then restart the backend.",
      });
    }

    try {
      const transporter = createEmailTransport();
      const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
      await transporter.sendMail({
        from: `"MedaSport Contact" <${smtpUser}>`,
        to: process.env.CONTACT_TO || smtpUser,
        replyTo: `"${name}" <${email}>`,
        subject: `New MedaSport contact message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Message:</strong></p>
            <p>${safeMessage}</p>
          </div>
        `,
      });
      res.json({
        success: true,
        message: "Thanks for reaching out. Your message has been sent.",
      });
    } catch (sendError) {
      console.error("Contact email send failed:", sendError);
      return res.status(500).json({
        error:
          "The email could not be sent right now. Check your Gmail app password and SMTP settings in Backend/.env.",
      });
    }
  }),
);

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected server error occurred."
        : err.message || "An unexpected server error occurred.",
  });
});

async function start() {
  try {
    await initializeDatabase();
    const server = app.listen(PORT, () =>
      console.log(`MedaSport API listening at http://localhost:${PORT}`),
    );
    const shutdown = () =>
      server.close(async () => {
        await close();
        process.exit(0);
      });
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Backend startup failed:", error.message);
    console.error(
      "Check Backend/.env and make sure MySQL is running and the database user can create databases.",
    );
    process.exitCode = 1;
  }
}

if (require.main === module) start();
module.exports = { app, start };
