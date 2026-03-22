import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, NativeModules, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Icon, FAB, Card, Switch, Button, IconButton } from 'react-native-paper';
import BackgroundTaskManager from '../../utils/BackgroundTaskManager';
import LogManager from '../../utils/LogManager';
import AppManager from '../../utils/AppManager';
import { Task, TaskInstruction } from '../../types/TaskInstruction';
import { InstructionEditor } from './components/InstructionEditor';
import { AppPicker } from './components/AppPicker';
import { CreateTaskModal } from './components/CreateTaskModal';

const { WakeScreenModule, TouchSimulationModule,AppLauncherModule } = NativeModules;
interface AppInfo {
  label: string;
  packageName: string;
  userId: number;
}

// 示例任务数据
const EXAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: '钉钉自动打卡',
    description: '早上8:32自动打卡',
    time: '00:09',
    status: 'running',
    type: 'daily',
    enabled: true,
    instruction: [
      {
        id: 'wake_up_1',
        type: 'wake_up',
      },
      {
        id: 'swipe_up_1',
        type: 'swipe',
        parameters: {
          direction: 'up',
          duration: 300
        },
        delay: 1000
      },
      {
        id: 'launch_dingtalk_1',
        type: 'launch_app',
        parameters: {
          packageName: 'com.alibaba.android.rimet',
          userId: 0
        },
        delay: 2000
      },
      {
        id: 'close_dingtalk_1',
        type: 'close_app',
        parameters:{
          packageName: 'com.alibaba.android.rimet',
          userId: 0
        },
        delay: 2000
      }
    ],
  },
  {
    id: '2',
    title: '钉钉自动打卡',
    description: '下午18:33自动打卡',
    time: '18:33',
    status: 'running',
    type: 'daily',
    instruction: [
      {
        id: 'swipe_up_1',
        type: 'wake_up',
        delay: 1000
      },
      {
        id: 'launch_dingtalk_1',
        type: 'launch_app',
        parameters: {
          packageName: 'com.alibaba.android.rimet',
          userId: 0
        },
      },
      {
        id: 'close_dingtalk_1',
        type: 'close_app',
        parameters:{
          packageName: 'com.alibaba.android.rimet',
          userId: 0
        }
      }
    ],
    enabled: true,
  },
];

function TaskHeader() {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.statBox}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>运行中</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>今日触发</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statItem]}>
          <Text style={[styles.statValue, { color: '#FF5252' }]}>1</Text>
          <Text style={styles.statLabel}>异常</Text>
        </View>
      </View>
    </View>
  );
}

// const STATUS_CONFIG = {
//   running: { label: '运行中', color: '#4CAF50' },
//   error: { label: '异常', color: '#FF5252' },
//   stopped: { label: '未运行', color: '#999' },
// };

function TaskItem({ item, onToggle, onEdit, onExecute, onDelete }: { 
  item: Task, 
  onToggle: (id: string) => void,
  onEdit: (task: Task) => void,
  onExecute: (task: Task) => void,
  onDelete: (id: string) => void
}) {
  const isSwitchOn = item.status !== 'stopped';

  return (
    <Card style={styles.taskCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.taskMainInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
            <Switch
              value={isSwitchOn}
              onValueChange={() => onToggle(item.id)}
              color="#4F46E5"
              style={styles.taskSwitch}
            />
          </View>
          
          {item.description && (
            <Text style={styles.taskDescription} numberOfLines={1}>{item.description}</Text>
          )}
          
          <View style={styles.taskFooter}>
            <View style={styles.timeInfo}>
              <Icon source="clock-outline" size={14} color="#666" />
              <Text style={styles.taskTime}>{item.time}</Text>
              <View style={styles.dot} />
              <Text style={styles.instructionCount}>
                {item.instruction.length} 个指令
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <IconButton 
                icon="pencil-outline" 
                size={18} 
                onPress={() => onEdit(item)}
                style={styles.iconBtn}
              />
              <IconButton 
                icon="delete-outline" 
                size={18} 
                iconColor="#FF5252"
                onPress={() => onDelete(item.id)}
                style={styles.iconBtn}
              />
              <IconButton 
                icon="play" 
                size={18} 
                iconColor="#4CAF50"
                onPress={() => onExecute(item)}
                style={styles.iconBtn}
              />
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>(EXAMPLE_TASKS);
  const [isAppPickerVisible, setAppPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [isInstructionEditorVisible, setInstructionEditorVisible] = useState(false);
  const [isCreateTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    // 初始化时添加一些示例任务
    tasks.forEach(task => {
      BackgroundTaskManager.addTask(
        task.id,
        task.title,
        task.time,
        task.instruction
      );
    });
    return () => {

    };
  }, [tasks]);

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const newStatus: 'running' | 'stopped' = task.status === 'stopped' ? 'running' : 'stopped';
        const updatedTask = {
          ...task,
          status: newStatus,
          enabled: newStatus === 'running'
        };

        // 同步到BackgroundTaskManager
        if (newStatus === 'running') {
          BackgroundTaskManager.enableTask(task.id);
        } else {
          BackgroundTaskManager.disableTask(task.id);
        }

        return updatedTask;
      }
      return task;
    }));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setInstructionEditorVisible(true);
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个任务吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            setTasks(prev => prev.filter(task => task.id !== id));
            BackgroundTaskManager.removeTask(id);
          }
        },
      ]
    );
  };

  const handleSaveNewTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(), // 简单生成 ID
    };

    setTasks(prev => [...prev, newTask]);
    
    // 同步到 BackgroundTaskManager
    BackgroundTaskManager.addTask(
      newTask.id,
      newTask.title,
      newTask.time,
      newTask.instruction
    );
    
    Alert.alert('创建成功', `任务 "${newTask.title}" 已创建`);
  };

  const handleExecuteTask = async (task: Task) => {
    try {
      await requestForegroundPermission();
      BackgroundTaskManager.executeTaskById(task.id);
      Alert.alert('执行成功', `任务 "${task.title}" 已执行`);
    } catch (error: any) {
      Alert.alert('执行失败', `执行任务 "${task.title}" 失败: ${error.message}`);
    }
  };

  const handleSaveInstructions = (instructions: TaskInstruction[]) => {
    if (!editingTask) return;

    try {
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { ...task, instruction: instructions }
          : task
      ));

      // 同步到BackgroundTaskManager
      const updatedTask = { ...editingTask, instruction: instructions };
      // 更新任务指令列表
      const existingTask = BackgroundTaskManager.getTask(updatedTask.id);
      if (existingTask) {
        existingTask.list = instructions;
        BackgroundTaskManager.syncToNative();
      }

      setInstructionEditorVisible(false);
      setEditingTask(null);
      Alert.alert('保存成功', '任务指令已更新');
    } catch (error: any) {
      Alert.alert('保存失败', `保存指令失败: ${error.message}`);
    }
  };

const requestForegroundPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissionsToRequest = [];

      if (Platform.Version >= 33) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      if (permissionsToRequest.length > 0) {
        const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const allGranted = Object.values(results).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          console.warn('部分权限未授予:', results);
        }
      }

      // 引导用户开启忽略电池优化
      if (WakeScreenModule && WakeScreenModule.requestIgnoreBatteryOptimizations) {
        WakeScreenModule.requestIgnoreBatteryOptimizations();
      }

      return true;
    } catch (err) {
      console.error('权限申请失败：', err);
      return false;
    }
  }
  return true;
};
  const cronSchedule = async () => {
    if (BackgroundTaskManager.isServiceRunning()) {
      Alert.alert('已停止', '后台调度服务已停止');
      await BackgroundTaskManager.stop();
    } else {
      const hasPermission = await requestForegroundPermission();
    if (!hasPermission) {
      Alert.alert('权限不足', '未获取前台服务权限，无法启动后台任务');
      return;
    }
      Alert.alert('已启动', '后台调度服务已启动，将每分钟检查一次任务');
      await BackgroundTaskManager.start();
    }
  };

  const handleOpenSettings = () => {
    WakeScreenModule.openSettings();
  };

  const handleOpenAccessibility = () => {
    TouchSimulationModule.openAccessibilitySettings();
  };

  const handleLaunchApp = async (packageName: string, userId: number = 0) => {
    LogManager.addLog(`尝试启动应用: ${packageName} (UID: ${userId})`, 'info');
    const success = await AppManager.launchApp(packageName, userId);
    if (success) {
      LogManager.addLog(`应用启动成功: ${packageName}`, 'success');
    } else {
      LogManager.addLog(`应用启动失败: ${packageName}`, 'error');
    }
  };

  const openAppPicker = async () => {
    try {
      const apps = await AppManager.getAllInstalledApps();
      setInstalledApps(apps);
      setAppPickerVisible(true);
    } catch (e) {
      Alert.alert('错误', '无法获取应用列表');
    }
  };

  const openCommonAppsPicker = async () => {
    try {
      const apps = await AppManager.getCommonApps();
      setInstalledApps(apps);
      setAppPickerVisible(true);
    } catch (e) {
      Alert.alert('错误', '无法获取常用应用列表');
    }
  };

  const selectApp = (packageName: string, userId: number) => {
    setAppPickerVisible(false);
    handleLaunchApp(packageName, userId);
  };

  return (
    <View style={styles.pageContainer}>
      <TaskHeader />
      
      <View style={styles.specialActionBox}>
        <Button 
          mode="contained" 
          onPress={() => cronSchedule()}
          icon="timer-outline"
          style={styles.wakeButton}
        >
          启动后台通知服务
        </Button>

        <Button 
          mode="text" 
          onPress={handleOpenSettings}
          icon="cog-outline"
          style={{ marginTop: 4 }}
          labelStyle={{ fontSize: 12 }}
        >
          亮屏失败？去设置开启“后台弹出界面”和“锁屏显示”
        </Button>

        <Button 
          mode="text" 
          onPress={handleOpenAccessibility}
          icon="gesture-tap"
          style={{ marginTop: -4 }}
          labelStyle={{ fontSize: 12, color: '#E91E63' }}
        >
          模拟上滑失败？去开启“辅助功能”服务
        </Button>

        <Button 
          mode="text" 
          onPress={openCommonAppsPicker}
          icon="star-outline"
          style={{ marginTop: -4 }}
          labelStyle={{ fontSize: 12, color: '#FF9800' }}
        >
          从常用应用选择并打开
        </Button>
      </View>

      <AppPicker
        visible={isAppPickerVisible}
        onClose={() => setAppPickerVisible(false)}
        onAppSelect={selectApp}
        installedApps={installedApps}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>任务列表</Text>
        <TouchableOpacity>
          <Text style={styles.filterText}>全部任务</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskItem 
            item={item} 
            onToggle={handleToggle}
            onEdit={handleEditTask}
            onExecute={handleExecuteTask}
            onDelete={handleDeleteTask}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setCreateTaskModalVisible(true)}
      />

      {/* 创建任务弹窗 */}
      <CreateTaskModal
        visible={isCreateTaskModalVisible}
        onClose={() => setCreateTaskModalVisible(false)}
        onSave={handleSaveNewTask}
      />

      {/* 指令编辑器 */}
      <InstructionEditor
        visible={isInstructionEditorVisible}
        onClose={() => {
          setInstructionEditorVisible(false);
          setEditingTask(null);
        }}
        onSave={handleSaveInstructions}
        task={editingTask}
        initialInstructions={editingTask?.instruction || []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  specialActionBox: {
    padding: 16,
    paddingTop: 0,
  },
  wakeButton: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  statBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#303F9F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#D1D9FF',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterText: {
    color: '#0088ff',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // 留出FAB的空间
  },
  taskCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 12,
  },
  taskMainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  taskSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  instructionCount: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    margin: 0,
    width: 32,
    height: 32,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  playButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
});
