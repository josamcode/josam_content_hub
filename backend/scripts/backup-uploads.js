#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const uploadsSource = process.env.BACKUP_UPLOADS_DIR || process.env.UPLOAD_DIR || "./uploads";
const sourceDir = path.resolve(process.cwd(), uploadsSource);
const backupDir = path.resolve(
  process.cwd(),
  process.env.BACKUP_DIR || "./backups/uploads"
);
const tarBin = process.env.BACKUP_TAR_BIN || "tar";

function fail(message, error) {
  console.error(`Uploads backup failed: ${message}`);

  if (error?.code === "ENOENT") {
    console.error(
      "tar was not found. Install tar or set BACKUP_TAR_BIN to the tar executable path."
    );
  } else if (error?.message) {
    console.error(error.message);
  }

  process.exit(1);
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

if (!fs.existsSync(sourceDir)) {
  fail(
    `Uploads directory does not exist: ${sourceDir}. Set BACKUP_UPLOADS_DIR or UPLOAD_DIR to the correct uploads path.`
  );
}

const sourceStats = fs.statSync(sourceDir);

if (!sourceStats.isDirectory()) {
  fail(`Uploads source is not a directory: ${sourceDir}`);
}

if (isInside(sourceDir, backupDir)) {
  fail("BACKUP_DIR must not be inside the uploads source directory.");
}

fs.mkdirSync(backupDir, { recursive: true });

const archiveFile = path.join(
  backupDir,
  `josam-content-hub-uploads-${timestamp()}.tar.gz`
);

const args = ["-czf", archiveFile, "-C", sourceDir, "."];

console.log("Starting uploads backup with tar.");
console.log(`Source directory: ${sourceDir}`);

const child = spawn(tarBin, args, {
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
  fail("Could not start tar.", error);
});

child.on("close", (code) => {
  if (code !== 0) {
    fail(`tar exited with code ${code}.`);
  }

  const stats = fs.statSync(archiveFile);

  if (stats.size === 0) {
    fail("Archive file was created but is empty.");
  }

  console.log("Uploads backup completed.");
  console.log(`Archive file: ${archiveFile}`);
  console.log(`Archive size: ${formatBytes(stats.size)}`);
});
