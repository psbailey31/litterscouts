/**
 * Scheduled Jobs Service
 * Manages periodic tasks using node-cron
 * 
 * Requirement 3.4: Update Litter Hotspot calculations within 5 minutes of new report submissions
 */

import cron, { ScheduledTask } from 'node-cron';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduledJobs() {
  console.log('[Scheduled Jobs] Initializing scheduled jobs...');

  // Hotspot calculation job - runs every 5 minutes
  // Requirement 3.4: Update hotspot calculations within 5 minutes
  const hotspotJob = cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Scheduled Jobs] Running hotspot calculation...');
      const result = await analyticsService.calculateAndUpdateHotspots();
      console.log(`[Scheduled Jobs] Hotspot calculation completed: ${result.hotspotsCalculated} hotspots calculated`);
    } catch (error: any) {
      console.error('[Scheduled Jobs] Error in hotspot calculation job:', error.message);
    }
  });

  console.log('[Scheduled Jobs] ✓ Hotspot calculation job scheduled (every 5 minutes)');

  // Event reminder job - runs every 10 minutes
  // Requirement 10.2: Send notifications within 10 minutes
  const eventReminderJob = cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('[Scheduled Jobs] Checking for event reminders...');
      const reminders = await notificationService.sendEventReminders();
      console.log(`[Scheduled Jobs] Event reminders sent: ${reminders.length} notifications`);
    } catch (error: any) {
      console.error('[Scheduled Jobs] Error in event reminder job:', error.message);
    }
  });

  console.log('[Scheduled Jobs] ✓ Event reminder job scheduled (every 10 minutes)');

  // Notification cleanup job - runs daily at 2 AM
  const notificationCleanupJob = cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Scheduled Jobs] Cleaning up old notifications...');
      const count = await notificationService.cleanupOldNotifications();
      console.log(`[Scheduled Jobs] Notification cleanup completed: ${count} notifications deleted`);
    } catch (error: any) {
      console.error('[Scheduled Jobs] Error in notification cleanup job:', error.message);
    }
  });

  console.log('[Scheduled Jobs] ✓ Notification cleanup job scheduled (daily at 2 AM)');

  // Keep-alive ping — prevents Koyeb from marking the service as idle
  if (process.env.NODE_ENV === 'production' && process.env.APP_URL) {
    const keepAliveJob = cron.schedule('*/10 * * * *', async () => {
      try {
        await fetch(`${process.env.APP_URL}/health`);
      } catch { /* ignore */ }
    });
    console.log('[Scheduled Jobs] ✓ Keep-alive ping scheduled (every 10 minutes)');
  }

  // Return job instances for potential management
  return {
    hotspotJob,
    eventReminderJob,
    notificationCleanupJob,
  };
}

/**
 * Stop all scheduled jobs
 * Useful for graceful shutdown
 */
export function stopScheduledJobs(jobs: { 
  hotspotJob: ScheduledTask;
  eventReminderJob: ScheduledTask;
  notificationCleanupJob: ScheduledTask;
}) {
  console.log('[Scheduled Jobs] Stopping all scheduled jobs...');
  
  if (jobs.hotspotJob) {
    jobs.hotspotJob.stop();
    console.log('[Scheduled Jobs] ✓ Hotspot calculation job stopped');
  }

  if (jobs.eventReminderJob) {
    jobs.eventReminderJob.stop();
    console.log('[Scheduled Jobs] ✓ Event reminder job stopped');
  }

  if (jobs.notificationCleanupJob) {
    jobs.notificationCleanupJob.stop();
    console.log('[Scheduled Jobs] ✓ Notification cleanup job stopped');
  }
}

export default {
  initializeScheduledJobs,
  stopScheduledJobs,
};
