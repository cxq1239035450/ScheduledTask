// 任务指令类型定义

export interface BaseInstruction {
  id: string;
  type: string;
  description?: string;
  delay?: number; // 延迟执行时间（毫秒）
  retryCount?: number; // 重试次数
  timeout?: number; // 超时时间（毫秒）
}

// 应用启动指令
export interface LaunchAppInstruction extends BaseInstruction {
  type: 'launch_app';
  packageName: string;
  userId?: number;
  waitForLaunch?: number; // 等待应用启动时间
}

// 点击指令
export interface ClickInstruction extends BaseInstruction {
  type: 'click';
  target: {
    type: 'coordinate' | 'text' | 'id' | 'description';
    value: string | { x: number; y: number };
    text?: string; // 可选的文本描述
  };
  longPress?: boolean;
  duration?: number; // 长按持续时间
}

// 滑动指令
export interface SwipeInstruction extends BaseInstruction {
  type: 'swipe';
  direction: 'up' | 'down' | 'left' | 'right' | 'custom';
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  duration?: number;
  distance?: number; // 滑动距离（像素）
}

// 输入文本指令
export interface InputTextInstruction extends BaseInstruction {
  type: 'input_text';
  text: string;
  target?: {
    type: 'id' | 'text' | 'description';
    value: string;
  };
  clearFirst?: boolean;
}

// 等待指令
export interface WaitInstruction extends BaseInstruction {
  type: 'wait';
  duration: number;
  waitForElement?: {
    type: 'text' | 'id' | 'description';
    value: string;
    timeout?: number;
  };
}

// 截图指令
export interface ScreenshotInstruction extends BaseInstruction {
  type: 'screenshot';
  filename?: string;
  saveToGallery?: boolean;
}

// Toast 提示指令
export interface ToastInstruction extends BaseInstruction {
  type: 'toast';
  message: string;
  duration?: 'short' | 'long';
}

// 日志指令
export interface LogInstruction extends BaseInstruction {
  type: 'log';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  category?: string;
}

// 条件判断指令
export interface ConditionalInstruction extends BaseInstruction {
  type: 'if';
  condition: {
    type: 'element_exists' | 'text_contains' | 'app_running' | 'time_range';
    target?: {
      type: 'text' | 'id' | 'description';
      value: string;
    };
    value?: string;
    startTime?: string;
    endTime?: string;
  };
  thenInstructions: TaskInstruction[];
  elseInstructions?: TaskInstruction[];
}

// 循环指令
export interface LoopInstruction extends BaseInstruction {
  type: 'loop';
  loopType: 'count' | 'while' | 'until';
  count?: number;
  condition?: {
    type: 'element_exists' | 'text_contains';
    target?: {
      type: 'text' | 'id' | 'description';
      value: string;
    };
    value?: string;
  };
  instructions: TaskInstruction[];
}

// 任务指令联合类型
export type TaskInstruction = 
  | LaunchAppInstruction
  | ClickInstruction
  | SwipeInstruction
  | InputTextInstruction
  | WaitInstruction
  | ScreenshotInstruction
  | ToastInstruction
  | LogInstruction
  | ConditionalInstruction
  | LoopInstruction;

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
  lastExecuted?: Date;
  nextExecution?: Date;
  retryCount?: number;
  maxRetries?: number;
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
      waitForLaunch: 3000
    }
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
        value: '打卡'
      },
      description: '点击打卡按钮'
    }
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
      duration: 500
    }
  },
  {
    id: 'wait_for_app',
    name: '等待应用加载',
    description: '等待应用完全加载',
    category: '等待操作',
    instruction: {
      id: 'wait_for_app',
      type: 'wait',
      duration: 2000
    }
  },
  {
    id: 'screenshot_result',
    name: '截图保存结果',
    description: '截图并保存到相册',
    category: '截图操作',
    instruction: {
      id: 'screenshot_result',
      type: 'screenshot',
      saveToGallery: true
    }
  }
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

export const INSTRUCTION_VALIDATION_RULES: { [key: string]: { [field: string]: ValidationRule } } = {
  launch_app: {
    packageName: { required: true, type: 'string' },
    waitForLaunch: { required: false, type: 'number', min: 0 }
  },
  click: {
    target: { required: true, type: 'object' },
    longPress: { required: false, type: 'boolean' },
    duration: { required: false, type: 'number', min: 0 }
  },
  swipe: {
    direction: { required: true, type: 'string', enum: ['up', 'down', 'left', 'right', 'custom'] },
    duration: { required: false, type: 'number', min: 0 },
    distance: { required: false, type: 'number', min: 0 }
  },
  input_text: {
    text: { required: true, type: 'string' },
    clearFirst: { required: false, type: 'boolean' }
  },
  wait: {
    duration: { required: false, type: 'number', min: 0 }
  },
  toast: {
    message: { required: true, type: 'string' },
    duration: { required: false, type: 'string', enum: ['short', 'long'] }
  },
  log: {
    level: { required: true, type: 'string', enum: ['info', 'success', 'warning', 'error'] },
    message: { required: true, type: 'string' }
  }
};