import BackgroundService from 'react-native-background-actions';
import cronParser from 'cron-parser';
import LogManager from './LogManager';

const options = {
    taskName: 'ScheduledTask',
    taskTitle: '定时任务正在运行',
    taskDesc: '每分钟检查一次任务队列',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#2196F3',
    parameters: {
        delay: 60000,
    },
};

class BackgroundTaskManager {
    private static instance: BackgroundTaskManager;
    private isRunning: boolean = false;

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

    // 核心后台执行逻辑
    private taskRunner = async (taskDataArguments?: any) => {
        try {
            const { delay } = taskDataArguments;
            
            console.log('BackgroundTaskManager: Background service started');
            await LogManager.addLog('后台调度服务已启动', 'info', '系统');

            while (BackgroundService.isRunning()) {
                const now = new Date();
                const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                
                // 检查 8:30 任务
                if (currentMinute === '08:30') {
                    console.log('BackgroundTaskManager: 触发 8:30 任务');
                    await LogManager.addLog('执行 8:30 定时任务: Console Log', 'success', '8:30 任务');
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
}

export default BackgroundTaskManager.getInstance();
