require("dotenv").config();
const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const path = require("path");
const initDbSchema = require("./config/initDb");
const nodemailer = require("nodemailer");
const session = require("express-session");

const app = express();

const db = require("./config/database");

// Initialize database schema tables & columns
initDbSchema();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const hbs = exphbs.create({
  helpers: {
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    truncate: function (str, len) {
      if (str.length > len) return str.substring(0, len) + "...";
      return str;
    },
    createPagination: (totalPages, currentPage) => {
      let pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    },
  },
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "your_super_secret_key",
    resave: false,
    saveUninitialized: false,
  }),
);

app.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 6;
    const offset = (page - 1) * itemsPerPage;

    const [allPosts] = await db.query("SELECT * FROM posts ORDER BY id DESC");

    const isFeatured = (category) =>
      ["Breaking News", "Injury Update", "Transfer"].includes(category);

    const featuredPosts = [];
    const remainingPosts = [];

    for (const post of allPosts) {
      if (isFeatured(post.category) && featuredPosts.length < 3) {
        featuredPosts.push(post);
      } else {
        remainingPosts.push(post);
      }
    }

    const totalPosts = remainingPosts.length;
    const totalPages = Math.ceil(totalPosts / itemsPerPage);

    if (page > totalPages && totalPages !== 0) return res.redirect("/?page=1");

    const olderPosts = remainingPosts.slice(offset, offset + itemsPerPage);

    res.render("pages/home", {
      featuredPosts,
      olderPosts,
      currentPage: page,
      totalPages,
      activePage: "home",
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    res.status(500).send("Error loading posts");
  }
});

app.get("/news", (req, res) =>
  res.render("pages/news", { activePage: "news" }),
);

app.get("/epl", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "Premier League",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "Premier League",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "Premier League",
    ]);
    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["Premier League"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["Premier League"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "Premier League",
    ]);

    res.render("competitions/epl-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/laliga", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "La Liga",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "La Liga",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "La Liga",
    ]);

    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["La Liga"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["La Liga"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "La Liga",
    ]);

    res.render("competitions/laliga-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/calcio", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "Serie A",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "Serie A",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "Serie A",
    ]);

    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["Serie A"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["Serie A"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "Serie A",
    ]);

    res.render("competitions/calcio-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/bundesliga", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "Bundesliga",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "Bundesliga",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "Bundesliga",
    ]);

    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["Bundesliga"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["Bundesliga"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "Bundesliga",
    ]);

    res.render("competitions/bundesliga-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/ligue1", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "Ligue 1",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "Ligue 1",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "Ligue 1",
    ]);

    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["Ligue 1"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["Ligue 1"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "Ligue 1",
    ]);

    res.render("competitions/ligue1-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/ucl", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "Champions League",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "Champions League",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "Champions League",
    ]);

    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["Champions League"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["Champions League"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "Champions League",
    ]);

    res.render("competitions/ucl-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
app.get("/uel", async (req, res) => {
  try {
    const [titles] = await db.query("SELECT * FROM titles WHERE league = ?", [
      "Europa League",
    ]);
    const [scorers] = await db.query("SELECT * FROM scorers WHERE league = ?", [
      "Europa League",
    ]);
    const [assists] = await db.query("SELECT * FROM assists WHERE league = ?", [
      "Europa League",
    ]);

    const [hattricks] = await db.query(
      "SELECT * FROM hattricks WHERE league = ?",
      ["Europa League"],
    );
    const [freekicks] = await db.query(
      "SELECT * FROM freekicks WHERE league = ?",
      ["Europa League"],
    );

    const [keepers] = await db.query("SELECT * FROM keepers WHERE league = ?", [
      "Europa League",
    ]);

    res.render("competitions/uel-news", {
      titles,
      scorers,
      assists,
      hattricks,
      freekicks,
      keepers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

function checkAdmin(req, res, next) {
  if (req.session && req.session.user === "admin") {
    next();
  } else {
    res.redirect("/admin/login");
  }
}

app.get("/admin/dashboard", checkAdmin, async (req, res) => {
  try {
    const [recentPosts] = await db.query(
      "SELECT * FROM posts ORDER BY id DESC LIMIT 6",
    );
    res.render("Admin/dashboard", {
      title: "Admin Dashboard",
      activePage: "admin/dashboard",
      recentPosts,
    });
  } catch (err) {
    console.error("Error fetching recent posts:", err);
    res.status(500).send("Error loading recent posts");
  }
});

app.post("/admin/post", checkAdmin, async (req, res) => {
  const { title, image, summary, category, author } = req.body;
  const postAuthor =
    author && author.trim() !== "" ? author.trim() : "MedaSport Admin";
  const sql =
    "INSERT INTO posts (title, image, summary, category, author) VALUES (?, ?, ?, ?, ?)";
  try {
    await db.query(sql, [title, image, summary, category, postAuthor]);
    res.redirect("/");
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Error saving post to database");
  }
});

app.get("/admin/edit/:id", checkAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    const [results] = await db.query("SELECT * FROM posts WHERE id = ?", [
      postId,
    ]);

    if (results.length === 0) return res.status(404).send("Post not found.");
    res.render("Admin/editpost", { post: results[0] });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).send("Error loading post for editing.");
  }
});

app.post("/admin/edit/:id", checkAdmin, async (req, res) => {
  const postId = req.params.id;
  const { title, image, summary, category, author } = req.body;
  const postAuthor =
    author && author.trim() !== "" ? author.trim() : "MedaSport Admin";
  const sql =
    "UPDATE posts SET title = ?, image = ?, summary = ?, category = ?, author = ? WHERE id = ?";
  try {
    await db.query(sql, [title, image, summary, category, postAuthor, postId]);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).send("Error updating post.");
  }
});

app.post("/admin/delete/:id", checkAdmin, async (req, res) => {
  const postId = req.params.id;
  try {
    await db.query("DELETE FROM posts WHERE id = ?", [postId]);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).send("Error deleting post.");
  }
});

function checkAdminhighlight(req, res, next) {
  if (req.session && req.session.user === "adminhighlight") {
    next();
  } else {
    res.redirect("/adminhighlight/login");
  }
}

app.get("/admin/highlights", checkAdminhighlight, async (req, res) => {
  try {
    const [highlights] = await db.query(
      "SELECT * FROM match_highlights ORDER BY created_at DESC LIMIT 5",
    );

    res.render("Admin/Highlights", {
      title: "Admin Highlights",
      activePage: "admin/highlights",
      highlights,
    });
  } catch (err) {
    console.error("Error loading highlights:", err);
    res.status(500).send("Failed to load highlights.");
  }
});

app.post("/admin/highlights", checkAdminhighlight, async (req, res) => {
  const { title, youtube_link, description } = req.body;
  const sql =
    "INSERT INTO match_highlights (title, youtube_link, description) VALUES (?, ?, ?)";
  try {
    await db.query(sql, [title, youtube_link, description]);
    res.redirect("/admin/highlights");
  } catch (err) {
    console.error("Error inserting highlight:", err);
    res.send("❌ Failed to upload highlight.");
  }
});

app.post(
  "/admin/highlights/delete/:id",
  checkAdminhighlight,
  async (req, res) => {
    const highlightId = req.params.id;
    try {
      await db.query("DELETE FROM match_highlights WHERE id = ?", [
        highlightId,
      ]);
      res.redirect("/admin/highlights");
    } catch (err) {
      console.error("Error deleting highlight:", err);
      res.status(500).send("Error deleting highlight.");
    }
  },
);

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

app.get("/highlights", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM match_highlights ORDER BY created_at DESC",
    );
    res.render("pages/highlights", {
      highlights: results,
      activePage: "highlights",
    });
  } catch (err) {
    console.error("Error fetching highlights:", err);
    res.send("❌ Failed to load highlights.");
  }
});

app.get("/highlights/:id", async (req, res) => {
  const highlightId = req.params.id;
  try {
    // Increment view count
    await db.query(
      "UPDATE match_highlights SET views = views + 1 WHERE id = ?",
      [highlightId],
    );

    // Fetch highlight details
    const [[highlight]] = await db.query(
      "SELECT * FROM match_highlights WHERE id = ?",
      [highlightId],
    );
    if (!highlight) return res.status(404).send("Highlight not found");

    // Fetch comments
    const [comments] = await db.query(
      "SELECT * FROM comments WHERE highlight_id = ? ORDER BY created_at DESC",
      [highlightId],
    );

    // Check if liked in session
    const likedHighlights = req.session.likedHighlights || {};
    const hasLiked = !!likedHighlights[highlightId];

    res.render("pages/highlight-detail", {
      highlight,
      comments,
      hasLiked,
      activePage: "highlights",
    });
  } catch (err) {
    console.error("Error fetching highlight details:", err);
    res.status(500).send("Error loading highlight.");
  }
});

app.post("/highlights/:id/like", async (req, res) => {
  const highlightId = req.params.id;
  req.session.likedHighlights = req.session.likedHighlights || {};

  try {
    if (req.session.likedHighlights[highlightId]) {
      // Unlike
      await db.query(
        "UPDATE match_highlights SET likes = GREATEST(0, likes - 1) WHERE id = ?",
        [highlightId],
      );
      delete req.session.likedHighlights[highlightId];
      const [[highlight]] = await db.query(
        "SELECT likes FROM match_highlights WHERE id = ?",
        [highlightId],
      );
      return res.json({ success: true, likes: highlight.likes, liked: false });
    } else {
      // Like
      await db.query(
        "UPDATE match_highlights SET likes = likes + 1 WHERE id = ?",
        [highlightId],
      );
      req.session.likedHighlights[highlightId] = true;
      const [[highlight]] = await db.query(
        "SELECT likes FROM match_highlights WHERE id = ?",
        [highlightId],
      );
      return res.json({ success: true, likes: highlight.likes, liked: true });
    }
  } catch (err) {
    console.error("Error liking highlight:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/highlights/:id/comment", async (req, res) => {
  const highlightId = req.params.id;
  const { name, comment_text } = req.body;
  if (!name || !comment_text) {
    return res.status(400).send("Name and comment are required.");
  }
  try {
    await db.query(
      "INSERT INTO comments (highlight_id, name, comment_text) VALUES (?, ?, ?)",
      [highlightId, name, comment_text],
    );
    res.redirect(`/highlights/${highlightId}`);
  } catch (err) {
    console.error("Error adding comment to highlight:", err);
    res.status(500).send("Error adding comment.");
  }
});

app.get("/news/:id", async (req, res) => {
  const postId = req.params.id;
  try {
    // Increment view count
    await db.query("UPDATE posts SET views = views + 1 WHERE id = ?", [postId]);

    // Fetch post details
    const [[post]] = await db.query("SELECT * FROM posts WHERE id = ?", [
      postId,
    ]);
    if (!post) return res.status(404).send("News not found");

    // Fetch comments
    const [comments] = await db.query(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC",
      [postId],
    );

    // Check if liked in session
    const likedPosts = req.session.likedPosts || {};
    const hasLiked = !!likedPosts[postId];

    res.render("pages/news", {
      post,
      comments,
      hasLiked,
      activePage: "news",
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).send("Error loading news article");
  }
});

app.post("/news/:id/like", async (req, res) => {
  const postId = req.params.id;
  req.session.likedPosts = req.session.likedPosts || {};

  try {
    if (req.session.likedPosts[postId]) {
      // Unlike
      await db.query(
        "UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ?",
        [postId],
      );
      delete req.session.likedPosts[postId];
      const [[post]] = await db.query("SELECT likes FROM posts WHERE id = ?", [
        postId,
      ]);
      return res.json({ success: true, likes: post.likes, liked: false });
    } else {
      // Like
      await db.query("UPDATE posts SET likes = likes + 1 WHERE id = ?", [
        postId,
      ]);
      req.session.likedPosts[postId] = true;
      const [[post]] = await db.query("SELECT likes FROM posts WHERE id = ?", [
        postId,
      ]);
      return res.json({ success: true, likes: post.likes, liked: true });
    }
  } catch (err) {
    console.error("Error liking post:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/news/:id/comment", async (req, res) => {
  const postId = req.params.id;
  const { name, comment_text } = req.body;
  if (!name || !comment_text) {
    return res.status(400).send("Name and comment are required.");
  }
  try {
    await db.query(
      "INSERT INTO comments (post_id, name, comment_text) VALUES (?, ?, ?)",
      [postId, name, comment_text],
    );
    res.redirect(`/news/${postId}`);
  } catch (err) {
    console.error("Error adding comment to post:", err);
    res.status(500).send("Error adding comment.");
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.q || "";
  if (!query.trim()) {
    return res.redirect("/");
  }
  try {
    const searchQuery = `%${query}%`;
    const [newsResults] = await db.query(
      "SELECT * FROM posts WHERE title LIKE ? OR summary LIKE ? OR category LIKE ? ORDER BY id DESC",
      [searchQuery, searchQuery, searchQuery],
    );
    const [highlightResults] = await db.query(
      "SELECT * FROM match_highlights WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC",
      [searchQuery, searchQuery],
    );
    const noResults = newsResults.length === 0 && highlightResults.length === 0;
    res.render("pages/search-results", {
      query,
      newsResults,
      highlightResults,
      noResults,
      activePage: "search",
    });
  } catch (err) {
    console.error("Error during search:", err);
    res.status(500).send("Error performing search.");
  }
});

app.post("/send-message", async (req, res) => {
  const { name, email, message } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: "New Contact Form Submission",
    html: `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong><br>${message}</p>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.render("pages/contact", {
      successMessage: "✅ Message sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.render("pages/contact", {
      errorMessage: "❌ Failed to send your message. Please try again.",
    });
  }
});

app.get("/contact", (req, res) =>
  res.render("pages/contact", { activePage: "contact" }),
);
app.get("/about", (req, res) =>
  res.render("pages/about", { activePage: "about" }),
);

app.get("/admin/login", (req, res) => {
  res.render("Admin/login");
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "adminpost" && password === "adminpost123") {
    req.session.user = "admin";
    res.redirect("/admin/dashboard");
  } else {
    res.render("Admin/login", { error: "Invalid credentials" });
  }
});

app.get("/adminhighlight/login", (req, res) => {
  res.render("Admin/highlightlogin");
});

app.post("/adminhighlight/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "adminhighlight" && password === "adminhighlight123") {
    req.session.user = "adminhighlight";
    res.redirect("/admin/Highlights");
  } else {
    res.render("Admin/highlightlogin", { error: "Invalid credentials" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});
