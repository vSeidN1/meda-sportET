# MedaSport 🇪🇹

A football news, match highlights and competition-history platform. The project is separated into a Vue 3 + Tailwind frontend and an Express + MySQL JSON API.

## Project layout

- `Frontend/` — Vue 3, Vue Router, Vite, Tailwind CSS and custom responsive styling.
- `Backend/` — Express API, MySQL schema/bootstrap, session-based admin authentication and contact email delivery.

The interface uses a dark editorial palette, restrained lime accent, responsive cards and a compact competition archive, following familiar sports-news design patterns while retaining MedaSport branding. No third-party site assets are bundled; existing MedaSport logos and competition marks were retained.

## Requirements

- Node.js 20+ and npm
- MySQL 8+ or a compatible MariaDB server

## Setup

1. Install project dependencies from the repository root with `npm install`.
2. Copy `Backend/.env.example` to `Backend/.env`; set the MySQL connection values and replace both admin passwords and `SESSION_SECRET` with private values.
3. Ensure the MySQL user can create a database. On first backend startup, the app creates the configured database and tables and seeds the seven competition names. Alternatively, import `Backend/schema.sql` with a MySQL user that can create databases. The schema file uses the default database name `medasport`; update its `CREATE DATABASE` and `USE` statements if using a different name.
4. Start the API with `npm run dev:backend` and the Vue dev server in another terminal with `npm run dev:frontend`.
5. Open `http://localhost:5173`. Vite proxies `/api` calls to the backend at `http://localhost:3000`.

For a production-style run, use `npm run build` followed by `npm start`; the backend serves the built frontend from `Frontend/dist`.

## Admin

Open `/admin`. Choose the news or highlights desk and sign in with the corresponding `ADMIN_POST_*` or `ADMIN_HIGHLIGHT_*` credentials from `Backend/.env`. The credentials previously hard-coded in the old app have intentionally not been retained.

## API overview

- `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts/:id/like`, `POST /api/posts/:id/comments`
- `GET /api/highlights`, `GET /api/highlights/:id`, `POST /api/highlights/:id/like`, `POST /api/highlights/:id/comments`
- `GET /api/competitions/:slug` for the seven former league pages
- `GET /api/search?q=...`, `POST /api/contact`, `GET /api/health`
- Admin session: `POST /api/admin/login`, `GET /api/admin/me`, `POST /api/admin/logout`
- Admin content: `POST/PUT/DELETE /api/admin/posts`, `POST/DELETE /api/admin/highlights`

The fresh database includes article, highlight, comment, competition and all six historical-stat tables (titles, scorers, assists, hat-tricks, free-kicks and keepers). The lost article and historical-stat rows cannot be reconstructed from the old source code, so these tables start empty; add verified records through SQL before presenting historical leaderboards.

## Contact email

To enable contact-form email, set `EMAIL_USER`, `EMAIL_PASS` (a Gmail app password), and optionally `CONTACT_TO` in `Backend/.env`. Without these settings the API returns a clear fallback message.
