import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "honeydew.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      onboarded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      meeting_day TEXT,
      meeting_time TEXT,
      meeting_confirmed INTEGER NOT NULL DEFAULT 0,
      streak_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      material_estimate TEXT,
      time_estimate TEXT,
      difficulty TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS availability (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      time_slot TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      UNIQUE(user_id, group_id, day_of_week, time_slot)
    );

    CREATE TABLE IF NOT EXISTS group_lists (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      added_by TEXT NOT NULL,
      position INTEGER,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (added_by) REFERENCES users(id),
      UNIQUE(group_id, task_id)
    );
  `);
}
