/**
 * Bull queue name constants
 *
 * Centralizes all queue names to avoid hardcoded strings across the codebase.
 */
export enum QueueName {
  TaskMonitor = 'task-monitor',
}

/**
 * Bull job name constants for TaskMonitor queue
 */
export enum TaskMonitorJob {
  CheckProcessingTasks = 'check-processing-tasks',
}
