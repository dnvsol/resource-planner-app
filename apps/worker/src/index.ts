import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';

const logger = pino({ name: 'dnvsol-worker' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Placeholder cleanup job — runs daily at 3 AM
const cleanupQueue = new Queue('placeholder-cleanup', { connection });

new Worker(
  'placeholder-cleanup',
  async () => {
    logger.info('Running placeholder cleanup...');
    // TODO: implement in Phase 3
  },
  { connection },
);

// Schedule cron jobs
async function setupCronJobs() {
  await cleanupQueue.add('cleanup', {}, { repeat: { pattern: '0 3 * * *' } });
  logger.info('Cron jobs scheduled');
}

async function main() {
  logger.info('DNVSol Worker starting...');
  await setupCronJobs();
  logger.info('DNVSol Worker ready');
}

main().catch((err) => {
  logger.error(err, 'Worker failed to start');
  process.exit(1);
});
