import { runHunter } from './hunter.js';
import Cron from 'cron';
import pino from 'pino';

const logger = pino({ name: 'hunter-cron' });

// Run the hunter every 15 minutes
const job = new Cron.CronJob('0 */15 * * * *', async () => {
  try {
    logger.info('Starting Hunter run');
    await runHunter({ maxPages: parseInt(process.env.HUNTER_MAX_PAGES || '3', 10) });
    logger.info('Hunter run complete');
  } catch (err) {
    logger.error({ err: err.message }, 'Hunter run failed');
  }
});

job.start();
logger.info('Hunter cron started');

// keep process alive
process.stdin.resume();
