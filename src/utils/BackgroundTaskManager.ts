import { NativeModules, DeviceEventEmitter } from 'react-native';
import LogManager from './LogManager';
import { TaskInstruction } from '../types/TaskInstruction';

const { BackgroundTaskModule, WakeScreenModule, TouchSimulationModule, AppLauncherModule } = NativeModules;


interface ScheduledTask {
    id: string;
    name: string;
    time: string;
    instruction: TaskInstruction[];
    lastExecuted?: Date;
    enabled: boolean;
}

const defaultOptions = {
    taskTitle: '定时任务正在运行',
    taskDesc: '每分钟检查一次任务队列',
};

class BackgroundTaskManager {
    private static instance: BackgroundTaskManager;
    private isRunning: boolean = false;
    private tasks: Map<string, ScheduledTask> = new Map();
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

    public async syncToNative() {
        if (!BackgroundTaskModule) {
            console.error('BackgroundTaskManager: BackgroundTaskModule is null');
            return;
        }
        
        if (typeof BackgroundTaskModule.syncTasks !== 'function') {
            console.error('BackgroundTaskManager: syncTasks is not a function. Available methods:', Object.keys(BackgroundTaskModule));
            return;
        }

        const allTasks = Array.from(this.tasks.values())
            .filter(t => t.enabled)
            .map(t => ({ id: t.id, time: t.time }));
        
        try {
            await BackgroundTaskModule.syncTasks(allTasks);
        } catch (e) {
            console.error('Failed to sync tasks to native', e);
        }
    }

    private async executeStep(step: TaskInstruction, taskName: string): Promise<void> {
        const { type, delay, parameters } = step;
        
        if (delay) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        switch (type) {
            case 'wake_up':
                console.log(`BackgroundTaskManager: 执行 wake_up`);
                await WakeScreenModule.wakeUp(false);
                await LogManager.addLog('屏幕已唤醒', 'success', taskName);
                break;

            case 'click':
                console.log(`BackgroundTaskManager: 执行 click`, parameters);
                try {
                    // 检查辅助功能服务是否可用
                    const isAccessibilityEnabled = await TouchSimulationModule.isAccessibilityServiceEnabled();
                    if (!isAccessibilityEnabled) {
                        throw new Error('辅助功能服务未启用，请在系统设置中开启 TouchSimulationService');
                    }
                    await TouchSimulationModule.simulateClick(
                        parameters?.x ?? 0,
                        parameters?.y ?? 0,
                        parameters?.duration ?? 100
                    );
                    await LogManager.addLog(`点击操作完成 (${parameters?.x}, ${parameters?.y})`, 'success', taskName);
                } catch (error: any) {
                    console.error('点击操作失败:', error);
                    await LogManager.addLog(`点击操作失败: ${error.message}`, 'error', taskName);
                    throw error;
                }
                break;

            case 'swipe':
                console.log(`BackgroundTaskManager: 执行 swipe`, parameters);
                try {
                    // 检查辅助功能服务是否可用
                    const isAccessibilityEnabled = await TouchSimulationModule.isAccessibilityServiceEnabled();
                    if (!isAccessibilityEnabled) {
                        throw new Error('辅助功能服务未启用，请在系统设置中开启 TouchSimulationService');
                    }
                    if (parameters?.direction === 'up') {
                        await TouchSimulationModule.simulateSwipeUp();
                    } else if (parameters?.direction === 'down') {
                        await TouchSimulationModule.simulateSwipeDown();
                    } else if (parameters?.direction === 'left') {
                        await TouchSimulationModule.simulateSwipeLeft();
                    } else if (parameters?.direction === 'right') {
                        await TouchSimulationModule.simulateSwipeRight();
                    } else {
                        await TouchSimulationModule.simulateSwipe(
                            parameters?.startX ?? 0,
                            parameters?.startY ?? 0,
                            parameters?.endX ?? 0,
                            parameters?.endY ?? 0,
                            parameters?.duration ?? 500
                        );
                    }
                    await LogManager.addLog(`滑动操作完成 (${parameters?.direction || '自定义'})`, 'success', taskName);
                } catch (error: any) {
                    console.error('滑动操作失败:', error);
                    await LogManager.addLog(`滑动操作失败: ${error.message}`, 'error', taskName);
                    throw error;
                }
                break;

            case 'launch_app':
                console.log(`BackgroundTaskManager: 执行 launch_app`, parameters);
                const success = await AppLauncherModule.launchApp(
                    parameters?.packageName,
                    parameters?.userId ?? 0
                );
                if (success) {
                    await LogManager.addLog(`应用启动成功: ${parameters?.packageName}`, 'success', taskName);
                } else {
                    throw new Error(`应用启动失败: ${parameters?.packageName}`);
                }
                break;

            case 'close_app':
                console.log(`BackgroundTaskManager: 执行 close_app`, parameters);
                const closeSuccess = await AppLauncherModule.closeApp(
                    parameters?.packageName,
                    parameters?.userId ?? 0
                );
                if (closeSuccess) {
                    await LogManager.addLog(`应用关闭成功: ${parameters?.packageName}`, 'success', taskName);
                } else {
                    throw new Error(`应用关闭失败: ${parameters?.packageName}`);
                }
                break;

            case 'wait':
                console.log(`BackgroundTaskManager: 执行 wait`, parameters);
                const duration = parameters?.duration ?? 1000;
                await new Promise(resolve => setTimeout(resolve, duration));
                await LogManager.addLog(`等待完成: ${duration}ms`, 'info', taskName);
                break;

            default:
                console.warn(`BackgroundTaskManager: 未知的步骤类型: ${type}`);
                await LogManager.addLog(`未知操作类型: ${type}`, 'warning', taskName);
        }
    }

    public async executeTaskById(taskId: string) {
        const task = this.tasks.get(taskId);
        if (!task || !task.enabled) return;

        const now = new Date();
        try {
            console.log(`BackgroundTaskManager: 正在执行定时任务 ${task.name} (${task.time})`);
            await LogManager.addLog(`执行定时任务: ${task.name}`, 'info', task.name);

            await BackgroundTaskModule.updateNotification({
                taskDesc: `正在执行: ${task.name}`
            });

            // 执行定时任务
            for (let i = 0; i < task.instruction.length; i++) {
                const step = task.instruction[i];
                console.log(`BackgroundTaskManager: 执行步骤 ${i + 1}/${task.instruction.length}`);
                await BackgroundTaskModule.updateNotification({
                    taskDesc: `正在执行: ${task.name} (${i + 1}/${task.instruction.length})`
                });
                await this.executeStep(step, task.name);
                await new Promise(resolve => setTimeout(resolve, step.delay ?? 1000));
            }
            await LogManager.addLog(`任务执行成功: ${task.name}`, 'success', task.name);

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
            const allTasks = Array.from(this.tasks.values()).filter(t => t.enabled);

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

    // 统一的任务添加方法
    public addTask(id: string, name: string, time: string, instruction: TaskInstruction[], enabled: boolean = true): void {
        const task: ScheduledTask = {
            id,
            name,
            time,
            instruction,
            enabled,
            lastExecuted: undefined
        };
        this.tasks.set(id, task);
        console.log(`BackgroundTaskManager: 已添加定时任务 ${name} (${time})`);
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

    
}

export default BackgroundTaskManager.getInstance();
