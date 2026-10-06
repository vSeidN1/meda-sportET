CREATE DATABASE IF NOT EXISTS medasport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medasport;

CREATE TABLE IF NOT EXISTS posts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(240) NOT NULL,
  image VARCHAR(2048) NULL,
  summary MEDIUMTEXT NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Other Sports',
  author VARCHAR(100) NOT NULL DEFAULT 'MedaSport Admin',
  views INT UNSIGNED NOT NULL DEFAULT 0,
  likes INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_posts_created (created_at),
  INDEX idx_posts_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS match_highlights (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(240) NOT NULL,
  youtube_link VARCHAR(2048) NOT NULL,
  description TEXT NULL,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  likes INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_highlights_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id INT UNSIGNED NULL,
  highlight_id INT UNSIGNED NULL,
  name VARCHAR(100) NOT NULL,
  owner_token CHAR(36) NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_comment_target CHECK ((post_id IS NOT NULL AND highlight_id IS NULL) OR (post_id IS NULL AND highlight_id IS NOT NULL)),
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_highlight FOREIGN KEY (highlight_id) REFERENCES match_highlights(id) ON DELETE CASCADE,
  INDEX idx_comments_post_created (post_id, created_at),
  INDEX idx_comments_highlight_created (highlight_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS standings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  club_name VARCHAR(120) NOT NULL,
  position TINYINT UNSIGNED NOT NULL DEFAULT 1,
  played TINYINT UNSIGNED NOT NULL DEFAULT 0,
  wins TINYINT UNSIGNED NOT NULL DEFAULT 0,
  draws TINYINT UNSIGNED NOT NULL DEFAULT 0,
  losses TINYINT UNSIGNED NOT NULL DEFAULT 0,
  goals_for SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  goals_against SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  goal_difference INT NOT NULL DEFAULT 0,
  points SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_standings_league_club (league, club_name),
  INDEX idx_standings_league_position (league, position),
  INDEX idx_standings_league_points (league, points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS competitions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  logo_path VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS titles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  club_name VARCHAR(120) NOT NULL,
  titles SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_titles_league_club (league, club_name),
  INDEX idx_titles_league (league, titles)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS scorers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  club_name VARCHAR(120) NULL,
  goals SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_scorers_league_player (league, player_name),
  INDEX idx_scorers_league (league, goals)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS assists (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  club_name VARCHAR(120) NULL,
  assists SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_assists_league_player (league, player_name),
  INDEX idx_assists_league (league, assists)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS hattricks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  club_name VARCHAR(120) NULL,
  hattricks SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_hattricks_league_player (league, player_name),
  INDEX idx_hattricks_league (league, hattricks)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS freekicks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  club_name VARCHAR(120) NULL,
  freekick_goals SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_freekicks_league_player (league, player_name),
  INDEX idx_freekicks_league (league, freekick_goals)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS keepers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  league VARCHAR(100) NOT NULL,
  player_name VARCHAR(120) NOT NULL,
  club_name VARCHAR(120) NULL,
  clean_sheets SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_keepers_league_player (league, player_name),
  INDEX idx_keepers_league (league, clean_sheets)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELETE t1 FROM standings t1 JOIN standings t2
  ON t1.id > t2.id AND t1.league = t2.league AND t1.club_name = t2.club_name;
DELETE t1 FROM scorers t1 JOIN scorers t2
  ON t1.id > t2.id AND t1.league = t2.league AND t1.player_name = t2.player_name;
DELETE t1 FROM assists t1 JOIN assists t2
  ON t1.id > t2.id AND t1.league = t2.league AND t1.player_name = t2.player_name;
DELETE t1 FROM keepers t1 JOIN keepers t2
  ON t1.id > t2.id AND t1.league = t2.league AND t1.player_name = t2.player_name;

DELETE t1 FROM titles t1 JOIN titles t2
  ON t1.id > t2.id AND t1.league = t2.league AND t1.club_name = t2.club_name;

INSERT INTO titles (league, club_name, titles) VALUES
  ('Premier League', 'Manchester United', 20),
  ('Premier League', 'Liverpool', 19),
  ('Premier League', 'Arsenal', 13),
  ('Premier League', 'Chelsea', 6),
  ('Premier League', 'Manchester City', 5),
  ('La Liga', 'Real Madrid', 36),
  ('La Liga', 'Barcelona', 27),
  ('La Liga', 'Atletico Madrid', 11),
  ('La Liga', 'Valencia', 6),
  ('La Liga', 'Athletic Club', 8),
  ('Serie A', 'Juventus', 36),
  ('Serie A', 'Inter Milan', 20),
  ('Serie A', 'AC Milan', 19),
  ('Serie A', 'Napoli', 3),
  ('Serie A', 'Roma', 3),
  ('Bundesliga', 'Bayern Munich', 33),
  ('Bundesliga', 'Borussia Dortmund', 5),
  ('Bundesliga', 'Bayer Leverkusen', 1),
  ('Bundesliga', 'RB Leipzig', 0),
  ('Bundesliga', 'Eintracht Frankfurt', 1),
  ('Ligue 1', 'Paris Saint-Germain', 13),
  ('Ligue 1', 'Marseille', 9),
  ('Ligue 1', 'Saint-Étienne', 10),
  ('Ligue 1', 'Monaco', 8),
  ('Ligue 1', 'Nice', 3),
  ('Champions League', 'Real Madrid', 15),
  ('Champions League', 'AC Milan', 7),
  ('Champions League', 'Liverpool', 6),
  ('Champions League', 'Bayern Munich', 6),
  ('Champions League', 'Barcelona', 5),
  ('Europa League', 'Sevilla', 7),
  ('Europa League', 'Juventus', 3),
  ('Europa League', 'Porto', 2),
  ('Europa League', 'Roma', 1),
  ('Europa League', 'Atalanta', 0)
ON DUPLICATE KEY UPDATE club_name = VALUES(club_name), titles = VALUES(titles);

INSERT INTO standings (league, club_name, position, played, wins, draws, losses, goals_for, goals_against, goal_difference, points) VALUES
  ('Premier League', 'Arsenal', 1, 8, 6, 2, 0, 19, 6, 13, 20),
  ('Premier League', 'Liverpool', 2, 8, 6, 1, 1, 18, 7, 11, 19),
  ('Premier League', 'Manchester City', 3, 8, 5, 2, 1, 17, 9, 8, 17),
  ('Premier League', 'Chelsea', 4, 8, 4, 2, 2, 15, 9, 6, 14),
  ('Premier League', 'Tottenham', 5, 8, 4, 1, 3, 13, 11, 2, 13),
  ('La Liga', 'Real Madrid', 1, 8, 7, 1, 0, 22, 6, 16, 22),
  ('La Liga', 'Barcelona', 2, 8, 6, 1, 1, 19, 7, 12, 19),
  ('La Liga', 'Girona', 3, 8, 5, 2, 1, 16, 9, 7, 17),
  ('La Liga', 'Atletico Madrid', 4, 8, 5, 1, 2, 14, 8, 6, 16),
  ('La Liga', 'Real Sociedad', 5, 8, 4, 2, 2, 12, 9, 3, 14),
  ('Serie A', 'Inter Milan', 1, 8, 6, 1, 1, 17, 6, 11, 19),
  ('Serie A', 'Juventus', 2, 8, 5, 2, 1, 16, 8, 8, 17),
  ('Serie A', 'Napoli', 3, 8, 5, 2, 1, 15, 9, 6, 17),
  ('Serie A', 'AC Milan', 4, 8, 4, 2, 2, 13, 10, 3, 14),
  ('Serie A', 'Roma', 5, 8, 4, 1, 3, 12, 11, 1, 13),
  ('Bundesliga', 'Bayer Leverkusen', 1, 8, 7, 1, 0, 21, 6, 15, 22),
  ('Bundesliga', 'Bayern Munich', 2, 8, 6, 1, 1, 23, 9, 14, 19),
  ('Bundesliga', 'RB Leipzig', 3, 8, 5, 2, 1, 18, 10, 8, 17),
  ('Bundesliga', 'Borussia Dortmund', 4, 8, 4, 2, 2, 16, 11, 5, 14),
  ('Bundesliga', 'Eintracht Frankfurt', 5, 8, 4, 1, 3, 15, 13, 2, 13),
  ('Ligue 1', 'Paris Saint-Germain', 1, 8, 7, 0, 1, 22, 6, 16, 21),
  ('Ligue 1', 'Nice', 2, 8, 5, 2, 1, 17, 9, 8, 17),
  ('Ligue 1', 'Monaco', 3, 8, 5, 1, 2, 15, 10, 5, 16),
  ('Ligue 1', 'Marseille', 4, 8, 4, 3, 1, 14, 9, 5, 15),
  ('Ligue 1', 'Lyon', 5, 8, 4, 1, 3, 12, 11, 1, 13),
  ('Champions League', 'Real Madrid', 1, 5, 4, 1, 0, 11, 3, 8, 13),
  ('Champions League', 'Manchester City', 2, 5, 4, 0, 1, 13, 5, 8, 12),
  ('Champions League', 'Bayern Munich', 3, 5, 3, 1, 1, 10, 4, 6, 10),
  ('Champions League', 'Inter Milan', 4, 5, 3, 0, 2, 9, 6, 3, 9),
  ('Champions League', 'Paris Saint-Germain', 5, 5, 2, 2, 1, 9, 7, 2, 8),
  ('Europa League', 'Atalanta', 1, 6, 4, 1, 1, 13, 4, 9, 13),
  ('Europa League', 'Porto', 2, 6, 4, 1, 1, 12, 5, 7, 13),
  ('Europa League', 'Roma', 3, 6, 3, 2, 1, 11, 7, 4, 11),
  ('Europa League', 'Lazio', 4, 6, 3, 1, 2, 9, 6, 3, 10),
  ('Europa League', 'Benfica', 5, 6, 3, 1, 2, 10, 8, 2, 10)
ON DUPLICATE KEY UPDATE club_name = VALUES(club_name), position = VALUES(position), played = VALUES(played), wins = VALUES(wins), draws = VALUES(draws), losses = VALUES(losses), goals_for = VALUES(goals_for), goals_against = VALUES(goals_against), goal_difference = VALUES(goal_difference), points = VALUES(points);

INSERT INTO scorers (league, player_name, club_name, goals) VALUES
  ('Premier League', 'Erling Haaland', 'Manchester City', 11),
  ('Premier League', 'Mohamed Salah', 'Liverpool', 9),
  ('La Liga', 'Robert Lewandowski', 'Barcelona', 12),
  ('La Liga', 'Kylian Mbappé', 'Real Madrid', 10),
  ('Serie A', 'Lautaro Martínez', 'Inter Milan', 10),
  ('Bundesliga', 'Harry Kane', 'Bayern Munich', 12),
  ('Ligue 1', 'Kylian Mbappé', 'Paris Saint-Germain', 11),
  ('Champions League', 'Erling Haaland', 'Manchester City', 7),
  ('Europa League', 'Rasmus Højlund', 'Atalanta', 6)
ON DUPLICATE KEY UPDATE club_name = VALUES(club_name), goals = VALUES(goals);

INSERT INTO assists (league, player_name, club_name, assists) VALUES
  ('Premier League', 'Bukayo Saka', 'Arsenal', 8),
  ('Premier League', 'Andrew Robertson', 'Liverpool', 7),
  ('La Liga', 'Lamine Yamal', 'Barcelona', 7),
  ('La Liga', 'Vinícius Júnior', 'Real Madrid', 6),
  ('Serie A', 'Nicolò Barella', 'Inter Milan', 6),
  ('Bundesliga', 'Jamal Musiala', 'Bayern Munich', 8),
  ('Ligue 1', 'Ousmane Dembélé', 'Paris Saint-Germain', 7),
  ('Champions League', 'Kevin De Bruyne', 'Manchester City', 5),
  ('Europa League', 'Federico Chiesa', 'Roma', 4)
ON DUPLICATE KEY UPDATE club_name = VALUES(club_name), assists = VALUES(assists);

INSERT INTO keepers (league, player_name, club_name, clean_sheets) VALUES
  ('Premier League', 'David Raya', 'Arsenal', 5),
  ('Premier League', 'Alisson Becker', 'Liverpool', 4),
  ('La Liga', 'Unai Simón', 'Athletic Club', 4),
  ('La Liga', 'Thibaut Courtois', 'Real Madrid', 5),
  ('Serie A', 'Mike Maignan', 'AC Milan', 4),
  ('Bundesliga', 'Gregor Kobel', 'Borussia Dortmund', 4),
  ('Ligue 1', 'Gianluigi Donnarumma', 'Paris Saint-Germain', 5),
  ('Champions League', 'Ederson', 'Manchester City', 3),
  ('Europa League', 'Rui Patrício', 'Roma', 3)
ON DUPLICATE KEY UPDATE club_name = VALUES(club_name), clean_sheets = VALUES(clean_sheets);

INSERT INTO competitions (slug, name, logo_path) VALUES
  ('epl', 'Premier League', '/images/logos/epl.png'),
  ('laliga', 'La Liga', '/images/logos/laliga.png'),
  ('calcio', 'Serie A', '/images/logos/serie a.webp'),
  ('bundesliga', 'Bundesliga', '/images/logos/bundesliga.png'),
  ('ligue1', 'Ligue 1', '/images/logos/ligue1.png'),
  ('ucl', 'Champions League', '/images/logos/ucl.png'),
  ('uel', 'Europa League', '/images/logos/uel.png')
ON DUPLICATE KEY UPDATE name = VALUES(name), logo_path = VALUES(logo_path);
