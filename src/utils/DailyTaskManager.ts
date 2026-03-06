/**
 * 平台无关的定时任务管理器
 * 从Android项目中抽离的核心定时任务逻辑
 * 可用于React Native、Web、Node.js等多种平台
 */

export interface DailyTask {
  id: string | number;
  time: string; // 格式: "HH:mm:ss"
  [key: string]: any; // 支持扩展属性
}

export interface TaskManagerConfig {
  enableRandomTime?: boolean;
  randomMinuteRange?: number;
  onTaskStart?: (task: DailyTask, index: number, actualTime: string) => void;
  onTaskComplete?: (task: DailyTask, index: number) => void;
  onAllTasksComplete?: () => void;
  onError?: (error: Error, context: string) => void;
  logger?: (message: string) => void;
}

export interface TaskExecutionResult {
  task: DailyTask;
  index: number;
  actualTime: string;
  countdownSeconds: number;
}

export class DailyTaskManager {
  private tasks: DailyTask[] = [];
  private isRunning: boolean = false;
  private currentTimer: NodeJS.Timeout | null = null;
  private config: Required<TaskManagerConfig>;
  private executedTasks: Set<string | number> = new Set();

  constructor(config: TaskManagerConfig = {}) {
    this.config = {
      enableRandomTime: config.enableRandomTime ?? true,
      randomMinuteRange: config.randomMinuteRange ?? 5,
      onTaskStart: config.onTaskStart ?? (() => {}),
      onTaskComplete: config.onTaskComplete ?? (() => {}),
      onAllTasksComplete: config.onAllTasksComplete ?? (() => {}),
      onError: config.onError ?? (() => {}),
      logger: config.logger ?? console.log,
    };
  }

  /**
   * 设置任务列表
   */
  setTasks(tasks: DailyTask[]): void {
    this.tasks = tasks.sort((a, b) => a.time.localeCompare(b.time));
    this.log(`任务列表已更新，共 ${tasks.length} 个任务`);
  }

  /**
   * 获取当前应该执行的任务索引
   * 找出第一个时间晚于当前时间的任务
   */
  private getCurrentTaskIndex(): number {
    const now = new Date();
    const currentMillis = now.getTime();

    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      const taskDateTime = this.getTaskDateTime(task.time);
      if (taskDateTime.getTime() > currentMillis) {
        return i;
      }
    }

    return -1; // 所有任务都已执行完毕
  }

  /**
   * 将任务时间字符串转换为今天的DateTime对象
   */
  private getTaskDateTime(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      seconds || 0
    );
  }

  /**
   * 计算任务时间与当前时间的差值，支持随机时间
   */
  private calculateTaskDiff(taskTime: string): { actualTime: string; diffSeconds: number } {
    const [hours, minutes, seconds] = taskTime.split(':').map(Number);
    let totalSeconds = hours * 3600 + minutes * 60 + (seconds || 0);

    // 添加随机时间
    if (this.config.enableRandomTime) {
      const randomMinutes = Math.floor(Math.random() * this.config.randomMinuteRange);
      const randomSeconds = Math.floor(Math.random() * 60);
      totalSeconds += randomMinutes * 60 + randomSeconds;

      // 确保不超过当天23:59:59（86399秒）
      totalSeconds = Math.min(totalSeconds, 86399);
    }

    // 转换回 HH:mm:ss 格式
    const actualHours = Math.floor(totalSeconds / 3600);
    const actualMinutes = Math.floor((totalSeconds % 3600) / 60);
    const actualSeconds = totalSeconds % 60;

    const actualTime = [
      actualHours.toString().padStart(2, '0'),
      actualMinutes.toString().padStart(2, '0'),
      actualSeconds.toString().padStart(2, '0')
    ].join(':');

    // 计算与当前时间的差值
    const taskDateTime = this.getTaskDateTime(actualTime);
    const currentMillis = Date.now();
    const diffSeconds = Math.floor((taskDateTime.getTime() - currentMillis) / 1000);

    return { actualTime, diffSeconds: Math.max(0, diffSeconds) };
  }

  /**
   * 启动任务调度
   */
  start(): void {
    if (this.isRunning) {
      this.log('任务调度已在运行中');
      return;
    }

    if (this.tasks.length === 0) {
      this.log('任务列表为空，无法启动调度');
      return;
    }

    this.isRunning = true;
    this.executedTasks.clear();
    this.log('开始执行每日任务调度');
    this.scheduleNextTask();
  }

  /**
   * 停止任务调度
   */
  stop(): void {
    if (!this.isRunning) {
      this.log('任务调度未在运行');
      return;
    }

    this.isRunning = false;
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    this.log('任务调度已停止');
  }

  /**
   * 调度下一个任务
   */
  private scheduleNextTask(): void {
    if (!this.isRunning) return;

    const taskIndex = this.getCurrentTaskIndex();

    if (taskIndex === -1) {
      this.log('今日所有任务已执行完毕');
      this.isRunning = false;
      this.config.onAllTasksComplete();
      return;
    }

    const task = this.tasks[taskIndex];
    const { actualTime, diffSeconds } = this.calculateTaskDiff(task.time);

    this.log(`准备执行第 ${taskIndex + 1} 个任务，计划时间：${task.time}，实际时间：${actualTime}`);

    // 触发任务开始回调
    this.config.onTaskStart(task, taskIndex + 1, actualTime);

    // 设置倒计时
    this.currentTimer = setTimeout(() => {
      this.executeTask(task, taskIndex);
    }, diffSeconds * 1000);

    this.log(`任务将在 ${diffSeconds} 秒后执行`);
  }

  /**
   * 执行任务
   */
  private executeTask(task: DailyTask, index: number): void {
    if (!this.isRunning) return;

    // 防止重复执行
    const taskKey = task.id || task.time;
    if (this.executedTasks.has(taskKey)) {
      this.log(`任务已执行过，跳过：${task.time}`);
      this.scheduleNextTask();
      return;
    }

    this.executedTasks.add(taskKey);
    this.log(`执行任务：${task.time}`);

    // 触发任务完成回调
    this.config.onTaskComplete(task, index + 1);

    // 调度下一个任务
    this.scheduleNextTask();
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isRunning: boolean;
    totalTasks: number;
    executedTasks: number;
    nextTask?: DailyTask;
    nextTaskIndex?: number;
  } {
    const nextTaskIndex = this.getCurrentTaskIndex();
    return {
      isRunning: this.isRunning,
      totalTasks: this.tasks.length,
      executedTasks: this.executedTasks.size,
      nextTask: nextTaskIndex >= 0 ? this.tasks[nextTaskIndex] : undefined,
      nextTaskIndex: nextTaskIndex >= 0 ? nextTaskIndex + 1 : undefined,
    };
  }

  /**
   * 重置已执行任务记录
   */
  resetExecutedTasks(): void {
    this.executedTasks.clear();
    this.log('已重置任务执行记录');
  }

  /**
   * 获取今天的任务执行计划
   */
  getTodaySchedule(): Array<{
    task: DailyTask;
    scheduledTime: string;
    countdownSeconds: number;
  }> {
    return this.tasks.map(task => {
      const { actualTime, diffSeconds } = this.calculateTaskDiff(task.time);
      return {
        task,
        scheduledTime: actualTime,
        countdownSeconds: diffSeconds,
      };
    });
  }

  private log(message: string): void {
    this.config.logger(`[DailyTaskManager] ${message}`);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.stop();
    this.tasks = [];
    this.executedTasks.clear();
  }
}