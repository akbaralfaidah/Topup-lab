type LogEvent = {
  event:
    | "readiness_failed"
    | "queue_connected"
    | "queue_error"
    | "job_completed"
    | "job_failed"
    | "worker_stopped"
    | "database_error";
  requestId?: string;
  jobId?: string;
};

export function logEvent(level: "info" | "error", data: LogEvent) {
  console[level](
    JSON.stringify({ level, time: new Date().toISOString(), ...data }),
  );
}
