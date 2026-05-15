const env = require("../config/env");
const {
  claimDueYouTubeSchedules,
  processClaimedSchedule,
  requeueStaleProcessingSchedules,
} = require("../modules/integrations/youtubeAutoUpload.service");

const DEFAULT_INTERVAL_MS = 60 * 1000;
const DEFAULT_BATCH_SIZE = 1;

function createYoutubeAutoUploadWorker({
  intervalMs = env.youtubeAutoUploadWorkerIntervalMs || DEFAULT_INTERVAL_MS,
  batchSize = env.youtubeAutoUploadWorkerBatchSize || DEFAULT_BATCH_SIZE,
} = {}) {
  let interval = null;
  let isRunning = false;

  async function runOnce() {
    if (isRunning) return null;

    isRunning = true;

    try {
      let requeuedCount = 0;

      try {
        requeuedCount = await requeueStaleProcessingSchedules();
      } catch (error) {
        console.error(
          `YouTube auto-upload worker: stale requeue failed: ${error.message || "unknown error"}`
        );
      }

      if (requeuedCount > 0) {
        console.log(
          `YouTube auto-upload worker: requeued ${requeuedCount} stale schedule(s)`
        );
      }

      const claimed = await claimDueYouTubeSchedules({ batchSize });

      if (claimed.length === 0) {
        return { processed: 0 };
      }

      let success = 0;
      let retry = 0;
      let failed = 0;

      for (const schedule of claimed) {
        try {
          const result = await processClaimedSchedule(schedule);

          if (result.ok) {
            success += 1;
          } else if (result.retryable) {
            retry += 1;
          } else {
            failed += 1;
          }
        } catch (error) {
          failed += 1;
          console.error(
            `YouTube auto-upload worker: unexpected error on schedule ${schedule.id}: ${error.message || "unknown error"}`
          );
        }
      }

      console.log(
        `YouTube auto-upload worker: processed ${claimed.length} (success=${success} retry=${retry} failed=${failed})`
      );

      return { processed: claimed.length, success, retry, failed };
    } catch (error) {
      console.error(
        `YouTube auto-upload worker tick failed: ${error.message || "unknown error"}`
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
  DEFAULT_BATCH_SIZE,
  createYoutubeAutoUploadWorker,
};
