const app = require("./app");
const env = require("./config/env");
const {
  createReminderMissedWorker,
} = require("./workers/reminderMissed.worker");

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

const reminderMissedWorker =
  env.nodeEnv === "test" ? null : createReminderMissedWorker();

if (reminderMissedWorker) {
  reminderMissedWorker.start();
}

process.on("SIGTERM", () => {
  if (reminderMissedWorker) {
    reminderMissedWorker.stop();
  }

  server.close(() => {
    process.exit(0);
  });
});
