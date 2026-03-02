import BackgroundService from 'react-native-background-actions';
import LogManager from './LogManager';
import TaskInstructionExecutor from './TaskInstructionExecutor';
import { Task } from '../types/TaskInstruction';

interface ScheduledTask {
    id: string;
    name: string;
    time: string;
    execute: () => Promise<void> | void;
    lastExecuted?: Date;
    enabled: boolean;
}

interface InstructionTask extends ScheduledTask {
    taskData: Task;
}

const options = {
    taskName: 'ScheduledTask',
    taskTitle: '定时任务正在运行',
    taskDesc: '每分钟检查一次任务队列',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    linkingURI: 'com.scheduledtask://chat/jane',
    color: '#2196F3',
    parameters: {
        delay: 60000,
    },
};

class BackgroundTaskManager {
    private static instance: BackgroundTaskManager;
    private isRunning: boolean = false;
    private tasks: Map<string, ScheduledTask> = new Map();
    private instructionTasks: Map<string, InstructionTask> = new Map();

    private constructor() {}

    public static getInstance(): BackgroundTaskManager {
        if (!BackgroundTaskManager.instance) {
            BackgroundTaskManager.instance = new BackgroundTaskManager();
        }
        return BackgroundTaskManager.instance;
    }

    private async sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    private shouldExecuteTask(task: ScheduledTask, currentMinute: string): boolean {
        if (!task.enabled) return false;
        if (task.time !== currentMinute) return false;
        if (task.lastExecuted) {
            const now = new Date();
            const lastExecuted = task.lastExecuted;
            if (now.getFullYear() === lastExecuted.getFullYear() &&
                now.getMonth() === lastExecuted.getMonth() &&
                now.getDate() === lastExecuted.getDate() &&
                now.getHours() === lastExecuted.getHours() &&
                now.getMinutes() === lastExecuted.getMinutes()) {
                return false;
            }
        }
        return true;
    }

    private taskRunner = async (taskDataArguments?: any) => {
        try {
            const { delay } = taskDataArguments;
            
            console.log('BackgroundTaskManager: Background service started');
            await LogManager.addLog('后台调度服务已启动', 'info', '系统');

            while (BackgroundService.isRunning()) {
                const now = new Date();
                const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                // 执行传统任务
                for (const [taskId, task] of this.tasks) {
                    if (this.shouldExecuteTask(task, currentMinute)) {
                        try {
                            console.log(`BackgroundTaskManager: 执行任务 ${task.name} (${task.time})`);
                            await LogManager.addLog(`执行定时任务: ${task.name}`, 'info', task.name);
                            await task.execute();
                            task.lastExecuted = now;
                            await LogManager.addLog(`任务执行成功: ${task.name}`, 'success', task.name);
                        } catch (error: any) {
                            console.error(`BackgroundTaskManager: 任务 ${task.name} 执行失败`, error);
                            await LogManager.addLog(`任务执行失败: ${task.name} - ${error.message}`, 'error', task.name);
                        }
                    }
                }

                // 执行指令任务
                for (const [taskId, task] of this.instructionTasks) {
                    if (this.shouldExecuteTask(task, currentMinute)) {
                        try {
                            console.log(`BackgroundTaskManager: 执行指令任务 ${task.name} (${task.time})`);
                            await LogManager.addLog(`执行指令任务: ${task.name}`, 'info', task.name);
                            
                            const result = await TaskInstructionExecutor.executeTask(
                                task.taskData.id,
                                task.taskData.instruction
                            );
                            
                            task.lastExecuted = now;
                            
                            if (result.success) {
                                await LogManager.addLog(
                                    `指令任务执行成功: ${task.name}`,
                                    'success',
                                    task.name
                                );
                            } else {
                                await LogManager.addLog(
                                    `指令任务执行失败: ${task.name} - ${result.error}`,
                                    'error',
                                    task.name
                                );
                            }
                        } catch (error: any) {
                            console.error(`BackgroundTaskManager: 指令任务 ${task.name} 执行失败`, error);
                            await LogManager.addLog(
                                `指令任务执行失败: ${task.name} - ${error.message}`,
                                'error',
                                task.name
                            );
                        }
                    }
                }

                await this.sleep(delay);
            }
        } catch (error: any) {
            console.error('BackgroundTaskManager: Error in task runner', error);
            await LogManager.addLog(`后台任务运行出错: ${error.message}`, 'error', '系统');
        } finally {
            this.isRunning = false;
            await LogManager.addLog('后台调度服务已停止', 'info', '系统');
        }
    };

    public async start() {
        if (this.isRunning) return;
        try {
            await BackgroundService.start(this.taskRunner, options);
            this.isRunning = true;
        } catch (e) {
            console.error('Failed to start background service', e);
        }
    }

    public async stop() {
        await BackgroundService.stop();
        this.isRunning = false;
        await LogManager.addLog('后台调度服务已停止', 'info', '系统');
    }

    public isServiceRunning() {
        return BackgroundService.isRunning();
    }

    public addTask(id: string, name: string, time: string, execute: () => Promise<void> | void): void {
        const task: ScheduledTask = {
            id,
            name,
            time,
            execute,
            enabled: true
        };
        this.tasks.set(id, task);
        console.log(`BackgroundTaskManager: 已添加任务 ${name} (${time})`);
    }

    public removeTask(id: string): boolean {
        const removed = this.tasks.delete(id);
        if (removed) {
            console.log(`BackgroundTaskManager: 已移除任务 ${id}`);
        }
        return removed;
    }

    public enableTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (task) {
            task.enabled = true;
            console.log(`BackgroundTaskManager: 已启用任务 ${task.name}`);
            return true;
        }
        return false;
    }

    public disableTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (task) {
            task.enabled = false;
            console.log(`BackgroundTaskManager: 已禁用任务 ${task.name}`);
            return true;
        }
        return false;
    }

    public getTask(id: string): ScheduledTask | undefined {
        return this.tasks.get(id);
    }

    public getAllTasks(): ScheduledTask[] {
        return Array.from(this.tasks.values());
    }

    public clearTasks(): void {
        this.tasks.clear();
        console.log('BackgroundTaskManager: 已清空所有任务');
    }

    // 指令任务管理方法
    public addInstructionTask(task: Task): void {
        const instructionTask: InstructionTask = {
            id: task.id,
            name: task.title,
            time: task.time,
            execute: async () => {
                // 这个execute方法不会被调用，实际执行在taskRunner中处理
            },
            enabled: task.enabled,
            taskData: task
        };
        this.instructionTasks.set(task.id, instructionTask);
        console.log(`BackgroundTaskManager: 已添加指令任务 ${task.title} (${task.time})`);
    }

    public removeInstructionTask(id: string): boolean {
        const removed = this.instructionTasks.delete(id);
        if (removed) {
            console.log(`BackgroundTaskManager: 已移除指令任务 ${id}`);
        }
        return removed;
    }

    public updateInstructionTask(task: Task): void {
        const existingTask = this.instructionTasks.get(task.id);
        if (existingTask) {
            existingTask.name = task.title;
            existingTask.time = task.time;
            existingTask.enabled = task.enabled;
            existingTask.taskData = task;
            console.log(`BackgroundTaskManager: 已更新指令任务 ${task.title}`);
        } else {
            this.addInstructionTask(task);
        }
    }

    public enableInstructionTask(id: string): boolean {
        const task = this.instructionTasks.get(id);
        if (task) {
            task.enabled = true;
            console.log(`BackgroundTaskManager: 已启用指令任务 ${task.name}`);
            return true;
        }
        return false;
    }

    public disableInstructionTask(id: string): boolean {
        const task = this.instructionTasks.get(id);
        if (task) {
            task.enabled = false;
            console.log(`BackgroundTaskManager: 已禁用指令任务 ${task.name}`);
            return true;
        }
        return false;
    }

    public getInstructionTask(id: string): InstructionTask | undefined {
        return this.instructionTasks.get(id);
    }

    public getAllInstructionTasks(): InstructionTask[] {
        return Array.from(this.instructionTasks.values());
    }

    public clearInstructionTasks(): void {
        this.instructionTasks.clear();
        console.log('BackgroundTaskManager: 已清空所有指令任务');
    }
}

export default BackgroundTaskManager.getInstance();
