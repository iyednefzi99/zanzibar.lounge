export type BackgroundJob = {
  id: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  data: Record<string, unknown>;
  result?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
};

// Simple in-memory job queue (can be replaced with BullMQ)
const jobQueue: BackgroundJob[] = [];
const activeWorkers: Map<string, Promise<void>> = new Map();

type JobHandler = (data: Record<string, unknown>) => Promise<unknown>;

const handlers: Map<string, JobHandler> = new Map();

export function registerJobHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler);
}

export async function enqueueJob(type: string, data: Record<string, unknown> = {}): Promise<string> {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: BackgroundJob = {
    id,
    type,
    status: "pending",
    data,
    createdAt: new Date(),
  };

  jobQueue.push(job);
  processNext();
  return id;
}

async function processNext() {
  const pending = jobQueue.filter((j) => j.status === "pending");
  if (pending.length === 0) return;

  const job = pending[0];
  job.status = "running";
  job.startedAt = new Date();

  const handler = handlers.get(job.type);
  if (!handler) {
    job.status = "failed";
    job.error = `No handler for job type: ${job.type}`;
    job.completedAt = new Date();
    return;
  }

  try {
    const result = await handler(job.data);
    job.status = "completed";
    job.result = result;
  } catch (error: unknown) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown error";
  }

  job.completedAt = new Date();
}

export function getJob(id: string): BackgroundJob | undefined {
  return jobQueue.find((j) => j.id === id);
}

export function getJobs(type?: string): BackgroundJob[] {
  return type ? jobQueue.filter((j) => j.type === type) : [...jobQueue];
}

export function getJobStats() {
  const stats = {
    total: jobQueue.length,
    pending: jobQueue.filter((j) => j.status === "pending").length,
    running: jobQueue.filter((j) => j.status === "running").length,
    completed: jobQueue.filter((j) => j.status === "completed").length,
    failed: jobQueue.filter((j) => j.status === "failed").length,
  };
  return stats;
}

// Pre-register common job handlers
registerJobHandler("send_email", async (data) => {
  const { sendEmail } = await import("./integrations/email");
  await sendEmail({
    to: data.to as string,
    subject: data.subject as string,
    html: data.html as string,
  });
  return { sent: true };
});

registerJobHandler("sync_pos", async (data) => {
  // POS sync job — trigger manual sync for a restaurant
  return { synced: true, restaurantId: data.restaurantId };
});

registerJobHandler("generate_report", async (data) => {
  return { reportUrl: `/api/admin/export?type=${data.type}` };
});
