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
  name: string;
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
    id: 'wake_up',
    name: '唤醒屏幕',
    description: '点亮并唤醒设备屏幕',
    category: '系统操作',
    instruction: {
      id: 'wake_up_1',
      type: 'wake_up',
    },
  },
  {
    id: 'launch_dingtalk',
    name: '启动钉钉',
    description: '启动钉钉应用',
    category: '应用操作',
    instruction: {
      id: 'launch_dingtalk_1',
      type: 'launch_app',
      parameters: {
        packageName: 'com.alibaba.android.rimet',
        userId: 0
      },
    },
  },
  {
    id: 'close_dingtalk',
    name: '关闭钉钉',
    description: '停止钉钉应用运行',
    category: '应用操作',
    instruction: {
      id: 'close_dingtalk_1',
      type: 'close_app',
      parameters: {
        packageName: 'com.alibaba.android.rimet',
        userId: 0
      },
    },
  },
  {
    id: 'click_center',
    name: '点击屏幕中心',
    description: '在屏幕中心位置执行点击',
    category: '触摸操作',
    instruction: {
      id: 'click_center_1',
      type: 'click',
      parameters: {
        x: 540,
        y: 1100,
        longPress: false,
        duration: 100
      },
    },
  },
  {
    id: 'swipe_up',
    name: '向上滑动',
    description: '从下往上滑动屏幕',
    category: '触摸操作',
    instruction: {
      id: 'swipe_up_1',
      type: 'swipe',
      parameters: {
        direction: 'up',
        duration: 300
      },
    },
  },
  {
    id: 'wait_2s',
    name: '等待2秒',
    description: '暂停执行2000毫秒',
    category: '流程控制',
    instruction: {
      id: 'wait_1',
      type: 'wait',
      parameters: {
        duration: 2000,
      },
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
