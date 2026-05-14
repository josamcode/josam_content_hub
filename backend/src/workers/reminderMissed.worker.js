const {
  markOverdueRemindersMissed,
} = require("../modules/reminders/reminderMissed.service");

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

function createReminderMissedWorker({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  let interval = null;
  let isRunning = false;

  async function runOnce() {
    if (isRunning) return null;

    isRunning = true;

    try {
      const result = await markOverdueRemindersMissed();

      if (result.count > 0) {
        console.log(`Marked ${result.count} overdue reminder(s) as missed`);
      }

      return result;
    } catch (error) {
      console.error(
        `Reminder missed worker failed: ${error.message || "unknown error"}`
      );
      return null;
    } finally {
      isRunning = false;
    }
  }

  function start() {
    if (interval) return;

    runOnce();
    interval = setInterval(runOnce, intervalMs);

    if (typeof interval.unref === "function") {
      interval.unref();
    }
  }

  function stop() {
    if (!interval) return;

    clearInterval(interval);
    interval = null;
  }

  return {
    start,
    stop,
    runOnce,
  };
}

module.exports = {
  DEFAULT_INTERVAL_MS,
  createReminderMissedWorker,
};
