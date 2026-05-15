const app = require("./app");
const env = require("./config/env");
const {
  createReminderMissedWorker,
} = require("./workers/reminderMissed.worker");
const {
  createYoutubeAutoUploadWorker,
} = require("./workers/youtubeAutoUpload.worker");

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

const reminderMissedWorker =
  env.nodeEnv === "test" ? null : createReminderMissedWorker();

const youtubeAutoUploadWorker =
  env.nodeEnv === "test" || !env.youtubeAutoUploadWorkerEnabled
    ? null
    : createYoutubeAutoUploadWorker();

if (reminderMissedWorker) {
  reminderMissedWorker.start();
}

if (youtubeAutoUploadWorker) {
  youtubeAutoUploadWorker.start();
}

function shutdown() {
  if (reminderMissedWorker) {
    reminderMissedWorker.stop();
  }

  if (youtubeAutoUploadWorker) {
    youtubeAutoUploadWorker.stop();
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
