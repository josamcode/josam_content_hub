#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const databaseUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
const backupDir = path.resolve(
  process.cwd(),
  process.env.BACKUP_DIR || "./backups/postgres"
);
const pgDumpBin = process.env.PG_DUMP_BIN || "pg_dump";
const allowRemote = process.env.BACKUP_ALLOW_REMOTE === "true";

let parsedDatabaseUrl = null;

function fail(message, error) {
  console.error(`PostgreSQL backup failed: ${message}`);

  if (error?.code === "ENOENT") {
    console.error(
      "pg_dump was not found. Install PostgreSQL client tools or set PG_DUMP_BIN to the pg_dump executable path."
    );
  } else if (error?.message) {
    console.error(error.message);
  }

  process.exit(1);
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function getDatabaseHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function parseDatabaseUrl(value) {
  try {
    const url = new URL(value);

    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function isLocalHost(host) {
  return ["localhost", "127.0.0.1", "::1"].includes(host);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

if (!databaseUrl) {
  fail("BACKUP_DATABASE_URL or DATABASE_URL is required.");
}

parsedDatabaseUrl = parseDatabaseUrl(databaseUrl);

if (!parsedDatabaseUrl) {
  fail("Database URL is invalid or is not a PostgreSQL URL.");
}

const databaseHost = getDatabaseHost(databaseUrl);

if (!databaseHost) {
  fail("Database URL is invalid.");
}

if (!isLocalHost(databaseHost) && !allowRemote) {
  fail(
    "Refusing to back up a non-local database unless BACKUP_ALLOW_REMOTE=true is set in the current secure shell/session."
  );
}

fs.mkdirSync(backupDir, { recursive: true });

const backupFile = path.join(
  backupDir,
  `josam-content-hub-postgres-${timestamp()}.dump`
);

const args = [
  "--format=custom",
  "--no-owner",
  "--no-acl",
  "--file",
  backupFile,
];

const pgDumpEnv = {
  ...process.env,
};

delete pgDumpEnv.BACKUP_DATABASE_URL;
delete pgDumpEnv.DATABASE_URL;

pgDumpEnv.PGHOST = parsedDatabaseUrl.hostname;
pgDumpEnv.PGDATABASE = decodeURIComponent(
  parsedDatabaseUrl.pathname.replace(/^\//, "")
);

if (parsedDatabaseUrl.port) {
  pgDumpEnv.PGPORT = parsedDatabaseUrl.port;
}

if (parsedDatabaseUrl.username) {
  pgDumpEnv.PGUSER = decodeURIComponent(parsedDatabaseUrl.username);
}

if (parsedDatabaseUrl.password) {
  pgDumpEnv.PGPASSWORD = decodeURIComponent(parsedDatabaseUrl.password);
}

if (parsedDatabaseUrl.searchParams.get("sslmode")) {
  pgDumpEnv.PGSSLMODE = parsedDatabaseUrl.searchParams.get("sslmode");
}

console.log("Starting PostgreSQL backup with pg_dump.");
console.log(`Output file: ${backupFile}`);

const child = spawn(pgDumpBin, args, {
  env: pgDumpEnv,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

child.on("error", (error) => {
  fail("Could not start pg_dump.", error);
});

child.on("close", (code) => {
  if (code !== 0) {
    fail(`pg_dump exited with code ${code}.`);
  }

  const stats = fs.statSync(backupFile);

  if (stats.size === 0) {
    fail("Backup file was created but is empty.");
  }

  console.log("PostgreSQL backup completed.");
  console.log(`Backup file: ${backupFile}`);
  console.log(`Backup size: ${formatBytes(stats.size)}`);
});
