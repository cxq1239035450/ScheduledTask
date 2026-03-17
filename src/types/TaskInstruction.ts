// 任务指令类型定义

export interface BaseInstruction {
  id: string;
  type: string;
  delay?: number; // 延迟执行时间（毫秒）
  retryCount?: number; // 重试次数
  timeout?: number; // 超时时间（毫秒）
  parameters?: Record<string, any>; // 指令参数，根据具体指令类型定义
}
// 唤醒指令
export interface WakeUpInstruction extends BaseInstruction {
  type: 'wake_up';
}
// 应用启动指令
export interface LaunchAppInstruction extends BaseInstruction {
  type: 'launch_app';
  parameters: {
    packageName: string; // 应用包名
    userId?: number; // 用户ID，可选，用于多用户环境
  };
}
// 关闭应用指令
export interface CloseAppInstruction extends BaseInstruction {
  type: 'close_app';
  parameters: {
    packageName: string; // 应用包名
    userId?: number; // 用户ID，可选，用于多用户环境
  };
}
// 点击指令
export interface ClickInstruction extends BaseInstruction {
  type: 'click';
  parameters: {
    x: number; // 点击坐标X
    y: number; // 点击坐标Y
    longPress?: boolean; // 是否长按
    duration?: number; // 长按持续时间（毫秒）
  };
}

// 滑动指令
export interface SwipeInstruction extends BaseInstruction {
  type: 'swipe';
  parameters: {
    direction: 'up' | 'down' | 'left' | 'right';
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    duration?: number; // 滑动持续时间（毫秒）
  };
}

// 等待指令
export interface WaitInstruction extends BaseInstruction {
  type: 'wait';
  parameters: {
    duration: number; // 等待持续时间（毫秒）
  };
}

// 任务指令联合类型
export type TaskInstruction =
  | CloseAppInstruction
  | WakeUpInstruction
  | LaunchAppInstruction
  | ClickInstruction
  | SwipeInstruction
  | WaitInstruction;

// 任务定义
export interface Task {
  id: string;
  title: string;
  description?: string;
  time: string; // 执行时间 "HH:MM"
  status: 'running' | 'stopped' | 'error';
  type: 'daily' | 'weekly' | 'monthly' | 'once';
  instruction: TaskInstruction[]; // 任务指令列表
  enabled: boolean;
  lastExecuted?: Date; // 上次执行时间
  nextExecution?: Date; // 下次执行时间
  retryCount?: number; // 重试次数
  maxRetries?: number; // 最大重试次数
}

// 指令执行结果
export interface InstructionResult {
  success: boolean;
  instructionId: string;
  message?: string;
  data?: any;
  error?: string;
  executionTime: number;
}

// 任务执行结果
export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  results: InstructionResult[];
  error?: string;
}

// 指令模板
export interface InstructionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  instruction: TaskInstruction;
  variables?: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    defaultValue?: any;
    description?: string;
  }[];
}

// 常用指令模板
export const COMMON_INSTRUCTION_TEMPLATES: InstructionTemplate[] = [
  {
    id: 'launch_wechat',
    name: '启动微信',
    description: '启动微信应用',
    category: '应用启动',
    instruction: {
      id: 'launch_wechat',
      type: 'launch_app',
      packageName: 'com.tencent.mm',
      waitForLaunch: 3000,
    },
  },
  {
    id: 'click_work_attendance',
    name: '点击工作打卡',
    description: '点击工作打卡按钮',
    category: '点击操作',
    instruction: {
      id: 'click_work_attendance',
      type: 'click',
      target: {
        type: 'text',
        value: '打卡',
      },
      description: '点击打卡按钮',
    },
  },
  {
    id: 'swipe_up_unlock',
    name: '上滑解锁',
    description: '向上滑动解锁屏幕',
    category: '滑动操作',
    instruction: {
      id: 'swipe_up_unlock',
      type: 'swipe',
      direction: 'up',
      distance: 200,
      duration: 500,
    },
  },
  {
    id: 'wait_for_app',
    name: '等待应用加载',
    description: '等待应用完全加载',
    category: '等待操作',
    instruction: {
      id: 'wait_for_app',
      type: 'wait',
      duration: 2000,
    },
  },
  {
    id: 'screenshot_result',
    name: '截图保存结果',
    description: '截图并保存到相册',
    category: '截图操作',
    instruction: {
      id: 'screenshot_result',
      type: 'screenshot',
      saveToGallery: true,
    },
  },
];

// 指令验证规则
export interface ValidationRule {
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
}

export const INSTRUCTION_VALIDATION_RULES: {
  [key: string]: { [field: string]: ValidationRule };
} = {
  launch_app: {
    packageName: { required: true, type: 'string' },
    waitForLaunch: { required: false, type: 'number', min: 0 },
  },
  click: {
    target: { required: true, type: 'object' },
    longPress: { required: false, type: 'boolean' },
    duration: { required: false, type: 'number', min: 0 },
  },
  swipe: {
    direction: {
      required: true,
      type: 'string',
      enum: ['up', 'down', 'left', 'right', 'custom'],
    },
    duration: { required: false, type: 'number', min: 0 },
    distance: { required: false, type: 'number', min: 0 },
  },
  input_text: {
    text: { required: true, type: 'string' },
    clearFirst: { required: false, type: 'boolean' },
  },
  wait: {
    duration: { required: false, type: 'number', min: 0 },
  },
  toast: {
    message: { required: true, type: 'string' },
    duration: { required: false, type: 'string', enum: ['short', 'long'] },
  },
  log: {
    level: {
      required: true,
      type: 'string',
      enum: ['info', 'success', 'warning', 'error'],
    },
    message: { required: true, type: 'string' },
  },
};
