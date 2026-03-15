import { NativeModules, Platform } from 'react-native';
import LogManager from './LogManager';
import AppManager from './AppManager';
import {
  TaskInstruction,
  InstructionResult,
  TaskExecutionResult,
  LaunchAppInstruction,
  ClickInstruction,
  SwipeInstruction,
  InputTextInstruction,
  WaitInstruction,
  ScreenshotInstruction,
  ToastInstruction,
  LogInstruction,
  ConditionalInstruction,
  LoopInstruction
} from '../types/TaskInstruction';

const { WakeScreenModule, TouchSimulationModule, AppLauncherModule } = NativeModules;

class TaskInstructionExecutor {
  private static instance: TaskInstructionExecutor;
  private isExecuting: boolean = false;
  private currentTaskId: string | null = null;

  private constructor() {}

  public static getInstance(): TaskInstructionExecutor {
    if (!TaskInstructionExecutor.instance) {
      TaskInstructionExecutor.instance = new TaskInstructionExecutor();
    }
    return TaskInstructionExecutor.instance;
  }

  /**
   * 执行单个指令
   */
  public async executeInstruction(
    instruction: TaskInstruction,
    context?: any
  ): Promise<InstructionResult> {
    const startTime = Date.now();
    
    try {
      // 延迟执行
      if (instruction.delay && instruction.delay > 0) {
        await this.sleep(instruction.delay);
      }

      let result: any;
      
      switch (instruction.type) {
        case 'launch_app':
          result = await this.executeLaunchApp(instruction as LaunchAppInstruction);
          break;
          
        case 'click':
          result = await this.executeClick(instruction as ClickInstruction);
          break;
          
        case 'swipe':
          result = await this.executeSwipe(instruction as SwipeInstruction);
          break;
          
        case 'input_text':
          result = await this.executeInputText(instruction as InputTextInstruction);
          break;
          
        case 'wait':
          result = await this.executeWait(instruction as WaitInstruction);
          break;
          
        case 'screenshot':
          result = await this.executeScreenshot(instruction as ScreenshotInstruction);
          break;
          
        case 'toast':
          result = await this.executeToast(instruction as ToastInstruction);
          break;
          
        case 'log':
          result = await this.executeLog(instruction as LogInstruction);
          break;
          
        case 'if':
          result = await this.executeConditional(instruction as ConditionalInstruction, context);
          break;
          
        case 'loop':
          result = await this.executeLoop(instruction as LoopInstruction, context);
          break;
          
        default:
          throw new Error(`未知的指令类型: ${(instruction as any).type}`);
      }

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        instructionId: instruction.id,
        message: `指令 ${instruction.type} 执行成功`,
        data: result,
        executionTime
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        instructionId: instruction.id,
        message: `指令 ${instruction.type} 执行失败`,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * 执行任务指令列表
   */
  public async executeTask(
    taskId: string,
    instructions: TaskInstruction[]
  ): Promise<TaskExecutionResult> {
    if (this.isExecuting) {
      throw new Error('已有任务正在执行中');
    }

    this.isExecuting = true;
    this.currentTaskId = taskId;
    const startTime = new Date();
    const results: InstructionResult[] = [];

    try {
      await LogManager.addLog(`开始执行任务: ${taskId}`, 'info', '任务执行');
      
      for (const instruction of instructions) {
        const result = await this.executeInstruction(instruction);
        results.push(result);
        
        if (!result.success) {
          await LogManager.addLog(
            `指令执行失败: ${result.error}`,
            'error',
            '任务执行'
          );
          break;
        }
        
        await LogManager.addLog(
          `指令执行成功: ${instruction.type}`,
          'success',
          '任务执行'
        );
      }

      const endTime = new Date();
      const success = results.every(r => r.success);
      
      await LogManager.addLog(
        `任务执行${success ? '成功' : '失败'}: ${taskId}`,
        success ? 'success' : 'error',
        '任务执行'
      );

      return {
        taskId,
        success,
        startTime,
        endTime,
        results
      };

    } catch (error: any) {
      const endTime = new Date();
      
      await LogManager.addLog(
        `任务执行异常: ${error.message}`,
        'error',
        '任务执行'
      );

      return {
        taskId,
        success: false,
        startTime,
        endTime,
        results,
        error: error.message
      };

    } finally {
      this.isExecuting = false;
      this.currentTaskId = null;
    }
  }

  /**
   * 执行应用启动指令
   */
  private async executeLaunchApp(instruction: LaunchAppInstruction): Promise<void> {
    await LogManager.addLog(
      `启动应用: ${instruction.packageName}`,
      'info',
      '指令执行'
    );
    
    const success = await AppManager.launchApp(
      instruction.packageName,
      instruction.userId || 0
    );
    
    if (!success) {
      throw new Error(`无法启动应用: ${instruction.packageName}`);
    }
    
    if (instruction.waitForLaunch) {
      await this.sleep(instruction.waitForLaunch);
    }
  }

  /**
   * 执行点击指令
   */
  private async executeClick(instruction: ClickInstruction): Promise<void> {
    await LogManager.addLog(
      `执行点击操作: ${JSON.stringify(instruction.target)}`,
      'info',
      '指令执行'
    );

    try {
      // 检查辅助功能服务是否可用
      const isAccessibilityEnabled = await TouchSimulationModule.isAccessibilityServiceEnabled();
      if (!isAccessibilityEnabled) {
        throw new Error('辅助功能服务未启用，请在系统设置中开启 TouchSimulationService');
      }

      if (instruction.target.type === 'coordinate') {
        const point = instruction.target.value as { x: number; y: number };
        
        if (instruction.longPress) {
          await TouchSimulationModule.simulateClick(point.x, point.y);
          await this.sleep(instruction.duration || 1000);
        } else {
          await TouchSimulationModule.simulateClick(point.x, point.y);
        }
      } else {
        // 这里需要实现基于文本、ID或描述的点击逻辑
        // 暂时使用模拟实现
        await TouchSimulationModule.simulateClick(500, 500);
      }
    } catch (error: any) {
      await LogManager.addLog(
        `点击操作失败: ${error.message}`,
        'error',
        '指令执行'
      );
      throw error;
    }
  }

  /**
   * 执行滑动指令
   */
  private async executeSwipe(instruction: SwipeInstruction): Promise<void> {
    await LogManager.addLog(
      `执行滑动操作: ${instruction.direction}`,
      'info',
      '指令执行'
    );

    try {
      // 检查辅助功能服务是否可用
      const isAccessibilityEnabled = await TouchSimulationModule.isAccessibilityServiceEnabled();
      if (!isAccessibilityEnabled) {
        throw new Error('辅助功能服务未启用，请在系统设置中开启 TouchSimulationService');
      }

      if (instruction.direction === 'custom' && instruction.startPoint && instruction.endPoint) {
        await TouchSimulationModule.simulateSwipe(
          instruction.startPoint.x,
          instruction.startPoint.y,
          instruction.endPoint.x,
          instruction.endPoint.y,
          instruction.duration || 500
        );
      } else {
        // 根据方向调用相应的滑动方法
        switch (instruction.direction) {
          case 'up':
            await TouchSimulationModule.simulateSwipeUp();
            break;
          case 'down':
            await TouchSimulationModule.simulateSwipeDown();
            break;
          case 'left':
            await TouchSimulationModule.simulateSwipeLeft();
            break;
          case 'right':
            await TouchSimulationModule.simulateSwipeRight();
            break;
          default:
            throw new Error(`不支持的滑动方向: ${instruction.direction}`);
        }
      }
    } catch (error: any) {
      await LogManager.addLog(
        `滑动操作失败: ${error.message}`,
        'error',
        '指令执行'
      );
      throw error;
    }
  }

  /**
   * 执行输入文本指令
   */
  private async executeInputText(instruction: InputTextInstruction): Promise<void> {
    await LogManager.addLog(
      `输入文本: ${instruction.text}`,
      'info',
      '指令执行'
    );
    
    // 这里需要实现文本输入逻辑
    // 暂时使用模拟实现
    console.log(`输入文本: ${instruction.text}`);
  }

  /**
   * 执行等待指令
   */
  private async executeWait(instruction: WaitInstruction): Promise<void> {
    await LogManager.addLog(
      `等待: ${instruction.duration}ms`,
      'info',
      '指令执行'
    );
    
    await this.sleep(instruction.duration);
  }

  /**
   * 执行截图指令
   */
  private async executeScreenshot(instruction: ScreenshotInstruction): Promise<void> {
    await LogManager.addLog(
      `执行截图: ${instruction.filename || 'screenshot.png'}`,
      'info',
      '指令执行'
    );
    
    // 这里需要实现截图逻辑
    // 暂时使用模拟实现
    console.log(`截图保存: ${instruction.filename}`);
  }

  /**
   * 执行Toast提示指令
   */
  private async executeToast(instruction: ToastInstruction): Promise<void> {
    await LogManager.addLog(
      `显示提示: ${instruction.message}`,
      'info',
      '指令执行'
    );
    
    // 这里需要实现Toast显示逻辑
    // 暂时使用日志代替
    console.log(`Toast: ${instruction.message}`);
  }

  /**
   * 执行日志指令
   */
  private async executeLog(instruction: LogInstruction): Promise<void> {
    await LogManager.addLog(
      instruction.message,
      instruction.level,
      instruction.category || '指令执行'
    );
  }

  /**
   * 执行条件判断指令
   */
  private async executeConditional(
    instruction: ConditionalInstruction,
    context?: any
  ): Promise<any> {
    const conditionMet = await this.evaluateCondition(instruction.condition, context);
    
    await LogManager.addLog(
      `条件判断: ${conditionMet ? '满足' : '不满足'}`,
      'info',
      '指令执行'
    );

    const instructionsToExecute = conditionMet 
      ? instruction.thenInstructions 
      : instruction.elseInstructions || [];

    for (const instr of instructionsToExecute) {
      await this.executeInstruction(instr, context);
    }
  }

  /**
   * 执行循环指令
   */
  private async executeLoop(
    instruction: LoopInstruction,
    context?: any
  ): Promise<any> {
    let iterations = 0;
    const maxIterations = instruction.count || 100; // 防止无限循环

    await LogManager.addLog(
      `开始循环: ${instruction.loopType}`,
      'info',
      '指令执行'
    );

    while (iterations < maxIterations) {
      if (instruction.loopType === 'count') {
        if (iterations >= (instruction.count || 0)) {
          break;
        }
      } else if (instruction.loopType === 'while' || instruction.loopType === 'until') {
        const conditionMet = await this.evaluateCondition(instruction.condition!, context);
        if ((instruction.loopType === 'while' && !conditionMet) ||
            (instruction.loopType === 'until' && conditionMet)) {
          break;
        }
      }

      for (const instr of instruction.instructions) {
        await this.executeInstruction(instr, context);
      }

      iterations++;
    }

    await LogManager.addLog(
      `循环结束，执行次数: ${iterations}`,
      'info',
      '指令执行'
    );
  }

  /**
   * 评估条件
   */
  private async evaluateCondition(condition: any, context?: any): Promise<boolean> {
    switch (condition.type) {
      case 'app_running':
        // 检查应用是否正在运行
        return true; // 模拟实现
        
      case 'time_range':
        // 检查当前时间是否在指定范围内
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return currentTime >= condition.startTime && currentTime <= condition.endTime;
        
      case 'element_exists':
      case 'text_contains':
        // 检查界面元素是否存在或包含指定文本
        return true; // 模拟实现
        
      default:
        return false;
    }
  }

  /**
   * 休眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查是否正在执行
   */
  public isCurrentlyExecuting(): boolean {
    return this.isExecuting;
  }

  /**
   * 获取当前执行的任务ID
   */
  public getCurrentTaskId(): string | null {
    return this.currentTaskId;
  }

  /**
   * 停止当前执行
   */
  public stopExecution(): void {
    this.isExecuting = false;
    this.currentTaskId = null;
  }
}

export default TaskInstructionExecutor.getInstance();