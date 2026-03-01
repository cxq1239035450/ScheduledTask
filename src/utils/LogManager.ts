import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  taskTitle?: string;
}

const LOG_STORAGE_KEY = '@task_logs';
const MAX_LOGS = 200; // 最多保留 200 条日志

class LogManager {
  private static instance: LogManager;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  /**
   * 添加一条日志
   */
  public async addLog(
    message: string,
    type: LogEntry['type'] = 'info',
    taskTitle?: string
  ): Promise<void> {
    try {
      const logs = await this.getLogs();
      const newLog: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type,
        message,
        taskTitle,
      };

      const updatedLogs = [newLog, ...logs].slice(0, MAX_LOGS);
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
      this.notifyListeners(updatedLogs);
    } catch (e) {
      console.error('Failed to add log', e);
    }
  }

  /**
   * 获取所有日志
   */
  public async getLogs(): Promise<LogEntry[]> {
    try {
      const storedLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      return storedLogs ? JSON.parse(storedLogs) : [];
    } catch (e) {
      console.error('Failed to get logs', e);
      return [];
    }
  }

  /**
   * 清空日志
   */
  public async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOG_STORAGE_KEY);
      this.notifyListeners([]);
    } catch (e) {
      console.error('Failed to clear logs', e);
    }
  }

  /**
   * 订阅日志变化
   */
  public subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    // 立即执行一次以获取当前数据
    this.getLogs().then(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(logs: LogEntry[]) {
    this.listeners.forEach(listener => listener(logs));
  }
}

export default LogManager.getInstance();
