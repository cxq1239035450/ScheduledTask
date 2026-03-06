import { NativeModules, DeviceEventEmitter } from 'react-native';
import LogManager from './LogManager';
import TaskInstructionExecutor from './TaskInstructionExecutor';
import { Task } from '../types/TaskInstruction';

const { BackgroundTaskModule } = NativeModules;

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

const defaultOptions = {
    taskTitle: '定时任务正在运行',
    taskDesc: '每分钟检查一次任务队列',
};

class BackgroundTaskManager {
    private static instance: BackgroundTaskManager;
    private isRunning: boolean = false;
    private tasks: Map<string, ScheduledTask> = new Map();
    private instructionTasks: Map<string, InstructionTask> = new Map();
    private tickSubscription: any = null;

    private constructor() {
        // 注册原生事件监听：每分钟心跳，用于更新通知状态
        this.tickSubscription = DeviceEventEmitter.addListener('onTick', () => {
            this.updateNotificationStatus();
        });

        // 注册原生事件监听：由 Native 触发的具体任务执行
        DeviceEventEmitter.addListener('executeTask', (taskId: string) => {
            console.log(`BackgroundTaskManager: Native triggered execution for task: ${taskId}`);
            this.executeTaskById(taskId);
        });
    }

    private async syncToNative() {
        if (!BackgroundTaskModule) {
            console.error('BackgroundTaskManager: BackgroundTaskModule is null');
            return;
        }
        
        if (typeof BackgroundTaskModule.syncTasks !== 'function') {
            console.error('BackgroundTaskManager: syncTasks is not a function. Available methods:', Object.keys(BackgroundTaskModule));
            return;
        }

        const allTasks = [
            ...Array.from(this.tasks.values()),
            ...Array.from(this.instructionTasks.values())
        ].filter(t => t.enabled)
         .map(t => ({ id: t.id, time: t.time }));
        
        try {
            await BackgroundTaskModule.syncTasks(allTasks);
        } catch (e) {
            console.error('Failed to sync tasks to native', e);
        }
    }

    public async executeTaskById(taskId: string) {
        const task = this.tasks.get(taskId) || this.instructionTasks.get(taskId);
        if (!task || !task.enabled) return;

        const now = new Date();
        try {
            const isInstruction = 'taskData' in task;
            const taskType = isInstruction ? '指令任务' : '定时任务';
            
            console.log(`BackgroundTaskManager: 正在执行${taskType} ${task.name} (${task.time})`);
            await LogManager.addLog(`执行${taskType}: ${task.name}`, 'info', task.name);
            
            await BackgroundTaskModule.updateNotification({
                taskDesc: `正在执行: ${task.name}`
            });

            if (isInstruction) {
                const result = await TaskInstructionExecutor.executeTask(
                    (task as InstructionTask).taskData.id,
                    (task as InstructionTask).taskData.instruction
                );
                if (result.success) {
                    await LogManager.addLog(`指令执行成功: ${task.name}`, 'success', task.name);
                } else {
                    throw new Error(result.error || '未知错误');
                }
            } else {
                await (task as ScheduledTask).execute();
                await LogManager.addLog(`任务执行成功: ${task.name}`, 'success', task.name);
            }
            
            task.lastExecuted = now;
        } catch (error: any) {
            console.error(`BackgroundTaskManager: 任务 ${task.name} 执行失败`, error);
            await LogManager.addLog(`任务执行失败: ${task.name} - ${error.message}`, 'error', task.name);
        } finally {
            this.updateNotificationStatus();
        }
    }

    private async updateNotificationStatus() {
        try {
            const allTasks = [
                ...Array.from(this.tasks.values()),
                ...Array.from(this.instructionTasks.values())
            ].filter(t => t.enabled);

            let nextTaskTimeStr = '无待处理任务';
            let earliestNextTask: Date | null = null;
            const nowForNext = new Date();

            for (const task of allTasks) {
                const [hours, minutes] = task.time.split(':').map(Number);
                const taskDate = new Date(nowForNext);
                taskDate.setHours(hours, minutes, 0, 0);
                
                if (taskDate.getTime() <= nowForNext.getTime()) {
                    taskDate.setDate(taskDate.getDate() + 1);
                }
                
                if (!earliestNextTask || taskDate.getTime() < earliestNextTask.getTime()) {
                    earliestNextTask = taskDate;
                    nextTaskTimeStr = task.time;
                }
            }

            const statusDesc = earliestNextTask 
                ? `下次任务：${nextTaskTimeStr}` 
                : '每分钟检查一次任务队列';
            
            await BackgroundTaskModule.updateNotification({ taskDesc: statusDesc });
        } catch (e) {
            console.error('Failed to update notification status', e);
        }
    }

    public static getInstance(): BackgroundTaskManager {
        if (!BackgroundTaskManager.instance) {
            BackgroundTaskManager.instance = new BackgroundTaskManager();
        }
        return BackgroundTaskManager.instance;
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

    private async checkAndExecuteTasks() {
        // 此方法已弃用，改为由 Native 触发 executeTask
        this.updateNotificationStatus();
    }

    public async start() {
        try {
            await BackgroundTaskModule.startService(defaultOptions);
            this.isRunning = true;
            await LogManager.addLog('后台调度服务已启动', 'info', '系统');
            await this.syncToNative();
            this.updateNotificationStatus();
        } catch (e) {
            console.error('Failed to start background service', e);
        }
    }

    public async stop() {
        await BackgroundTaskModule.stopService();
        this.isRunning = false;
        await LogManager.addLog('后台调度服务已停止', 'info', '系统');
    }

    public isServiceRunning() {
        return this.isRunning;
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
        this.syncToNative();
    }

    public removeTask(id: string): boolean {
        const removed = this.tasks.delete(id);
        if (removed) {
            console.log(`BackgroundTaskManager: 已移除任务 ${id}`);
            this.syncToNative();
        }
        return removed;
    }

    public enableTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (task) {
            task.enabled = true;
            console.log(`BackgroundTaskManager: 已启用任务 ${task.name}`);
            this.syncToNative();
            return true;
        }
        return false;
    }

    public disableTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (task) {
            task.enabled = false;
            console.log(`BackgroundTaskManager: 已禁用任务 ${task.name}`);
            this.syncToNative();
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
        this.syncToNative();
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
        this.syncToNative();
    }

    public removeInstructionTask(id: string): boolean {
        const removed = this.instructionTasks.delete(id);
        if (removed) {
            console.log(`BackgroundTaskManager: 已移除指令任务 ${id}`);
            this.syncToNative();
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
        this.syncToNative();
    }

    public enableInstructionTask(id: string): boolean {
        const task = this.instructionTasks.get(id);
        if (task) {
            task.enabled = true;
            console.log(`BackgroundTaskManager: 已启用指令任务 ${task.name}`);
            this.syncToNative();
            return true;
        }
        return false;
    }

    public disableInstructionTask(id: string): boolean {
        const task = this.instructionTasks.get(id);
        if (task) {
            task.enabled = false;
            console.log(`BackgroundTaskManager: 已禁用指令任务 ${task.name}`);
            this.syncToNative();
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
