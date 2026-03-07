/**
 * Bull queue configuration constants
 *
 * Each queue entry exposes:
 *  - NAME  — queue name string used in BullModule.registerQueue / @Processor / @InjectQueue
 *  - JOBS  — job name strings used in queue.add() calls
 *
 * Derived helpers:
 *  - QUEUE_NAMES — { name } array ready for BullModule.registerQueue(...QUEUE_NAMES)
 */

export const TASK_MONITOR_QUEUE = {
  MONITOR: {
    NAME: 'task-monitor',
    JOBS: {
      CHECK_PROCESSING_TASKS: 'check-processing-tasks',
    },
  },
} as const

/** Spread into BullModule.registerQueue() */
export const QUEUE_NAMES = Object.values(TASK_MONITOR_QUEUE).map(({ NAME }) => ({ name: NAME }))
