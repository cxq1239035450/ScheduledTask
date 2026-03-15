import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, NativeModules, Alert, Modal, ScrollView, PermissionsAndroid, Platform } from 'react-native';
import { Icon, FAB, Card, Switch, Button, List, Searchbar, Divider, TextInput } from 'react-native-paper';
import BackgroundTaskManager from '../../utils/BackgroundTaskManager';
import LogManager from '../../utils/LogManager';
import AppManager from '../../utils/AppManager';
import TaskInstructionExecutor from '../../utils/TaskInstructionExecutor';
import { Task, TaskInstruction, COMMON_INSTRUCTION_TEMPLATES } from '../../types/TaskInstruction';

const { WakeScreenModule, TouchSimulationModule, AppLauncherModule } = NativeModules;

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
    time: '08:32',
    status: 'running',
    type: 'daily',
    instruction: [
    ],
    enabled: true
  }
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

const STATUS_CONFIG = {
  running: { label: '运行中', color: '#4CAF50' },
  error: { label: '异常', color: '#FF5252' },
  stopped: { label: '未运行', color: '#999' },
};

function TaskItem({ item, onToggle, onEdit, onExecute }: { 
  item: Task, 
  onToggle: (id: string) => void,
  onEdit: (task: Task) => void,
  onExecute: (task: Task) => void 
}) {
  const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
  
  // Switch 开启状态：运行中或异常
  const isSwitchOn = item.status !== 'stopped';

  return (
    <Card style={styles.taskCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.taskDescription}>{item.description}</Text>
          )}
          <View style={styles.timeRow}>
            <Icon source="clock-outline" size={14} color="#666" />
            <Text style={styles.taskTime}>{item.time}</Text>
            <Text style={styles.instructionCount}>
              {item.instruction.length} 个指令
            </Text>
          </View>
        </View>
        <View style={styles.statusAction}>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onEdit(item)}
            >
              <Icon source="pencil" size={16} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onExecute(item)}
            >
              <Icon source="play" size={16} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <Switch
            value={isSwitchOn}
            onValueChange={() => onToggle(item.id)}
            color="#4F46E5"
          />
        </View>
      </Card.Content>
    </Card>
  );
}

export default function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>(EXAMPLE_TASKS);
  const [isAppPickerVisible, setAppPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInstructionEditorVisible, setInstructionEditorVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [instructionJson, setInstructionJson] = useState('');

  useEffect(() => {
    // 初始化时添加一些示例任务
    BackgroundTaskManager.addTask(
      'wakeup',
      '唤醒屏幕',
      '23:15',
      [
        // {
        //   type: 'wake_up',
        //   parameters: { level: 'info', message: '开始执行唤醒任务' },
        //   waitTime: 5000
        // },
        {
          type: 'swipe',
          parameters: { direction: 'up' },
          waitTime: 5000
        },
        {
          type: 'launch_app',
          // parameters: { packageName: 'com.alibaba.android.rimet' }
          parameters: { packageName: 'com.alibaba.android.rimet' },
          waitTime: 5000
        },
        {
          type: 'close_app',
          // parameters: { packageName: 'com.alibaba.android.rimet' }
          parameters: { packageName: 'com.alibaba.android.rimet' },
          waitTime: 5000
        },
      ]
    );

    return () => {

    };
  }, []);

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
    setInstructionJson(JSON.stringify(task.instruction, null, 2));
    setInstructionEditorVisible(true);
  };

  const handleExecuteTask = async (task: Task) => {
    try {
      Alert.alert('执行任务', `确定要执行任务 "${task.title}" 吗？`, [
        { text: '取消', style: 'cancel' },
        { 
          text: '执行', 
          onPress: async () => {
            try {
              const result = await TaskInstructionExecutor.executeTask(task.id, task.instruction);
              Alert.alert(
                '执行完成', 
                `任务执行${result.success ? '成功' : '失败'}\n耗时: ${result.endTime.getTime() - result.startTime.getTime()}ms`
              );
            } catch (error: any) {
              Alert.alert('执行失败', error.message);
            }
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const handleSaveInstruction = () => {
    if (!editingTask) return;

    try {
      const instructions = JSON.parse(instructionJson) as TaskInstruction[];
      
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
      Alert.alert('保存失败', `JSON格式错误: ${error.message}`);
    }
  };

  const handleAddInstructionTemplate = (template: any) => {
    if (!editingTask) return;

    const newInstruction = { ...template.instruction };
    newInstruction.id = `${newInstruction.id}_${Date.now()}`;

    const updatedInstructions = [...editingTask.instruction, newInstruction];
    setInstructionJson(JSON.stringify(updatedInstructions, null, 2));
  };

  const scheduleWakeup = (minutes: number) => {
    const ms = minutes * 1000;
    
    LogManager.addLog(`设置 ${minutes} 分钟后自动亮屏任务`, 'info', '测试任务');
    console.log(`Setting background timer for ${minutes} minutes (${ms}ms)...`);
    Alert.alert('已设置', `系统将在 ${minutes} 分钟后自动亮屏。请保持应用在后台运行，不要彻底关闭。`);

    // BackgroundTimer.setTimeout(() => {
    //   LogManager.addLog('触发定时器，正在唤醒屏幕...', 'info', '测试任务');
    //   console.log('Background timer triggered! Calling native wakeUp...');
    //   WakeScreenModule.wakeUp(false);
      
    //   // 亮屏后延迟 1 秒执行上滑动作
    //   BackgroundTimer.setTimeout(() => {
    //     LogManager.addLog('正在模拟上滑动作...', 'info', '测试任务');
    //     console.log('Calling native TouchSimulationModule.simulateSwipeUp...');
    //     TouchSimulationModule.simulateSwipeUp();
    //     LogManager.addLog('上滑动作已执行', 'success', '测试任务');
    //   }, 2000);
      
    // }, ms);
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
      setFilteredApps(apps);
      setAppPickerVisible(true);
    } catch (e) {
      Alert.alert('错误', '无法获取应用列表');
    }
  };

  const openCommonAppsPicker = async () => {
    try {
      const apps = await AppManager.getCommonApps();
      setInstalledApps(apps);
      setFilteredApps(apps);
      setAppPickerVisible(true);
    } catch (e) {
      Alert.alert('错误', '无法获取常用应用列表');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = installedApps.filter(app => 
        app.label.toLowerCase().includes(query.toLowerCase()) || 
        app.packageName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(installedApps);
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
          onPress={() => scheduleWakeup(10)}
          icon="timer-outline"
          style={styles.wakeButton}
        >
          测试按钮
        </Button>

        <Button 
          mode="contained" 
          onPress={() => cronSchedule()}
          icon="timer-outline"
          style={styles.wakeButton}
        >
          测试定时任务按钮
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
          onPress={openAppPicker}
          icon="application-export"
          style={{ marginTop: -4 }}
          labelStyle={{ fontSize: 12, color: '#4CAF50' }}
        >
          从应用列表选择并打开
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

      <Modal
        visible={isAppPickerVisible}
        animationType="slide"
        onRequestClose={() => setAppPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择应用</Text>
            <Button onPress={() => setAppPickerVisible(false)}>关闭</Button>
          </View>
          
          <Searchbar
            placeholder="搜索应用或包名"
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />

          <FlatList
            data={filteredApps}
            keyExtractor={(item) => item.packageName + item.userId}
            renderItem={({ item }) => (
              <List.Item
                title={item.label}
                description={`${item.packageName} (用户ID: ${item.userId})`}
                onPress={() => selectApp(item.packageName, item.userId)}
                left={props => <List.Icon {...props} icon={item.userId > 0 ? "account-multiple" : "android"} />}
              />
            )}
            ItemSeparatorComponent={() => <Divider />}
          />
        </View>
      </Modal>

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
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log('Add Task')}
      />

      {/* 指令编辑器模态框 */}
      <Modal
        visible={isInstructionEditorVisible}
        animationType="slide"
        onRequestClose={() => setInstructionEditorVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              编辑任务指令 - {editingTask?.title}
            </Text>
            <TouchableOpacity onPress={() => setInstructionEditorVisible(false)}>
              <Icon source="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.instructionEditorContainer}>
            <Text style={styles.sectionTitle}>指令模板</Text>
            <ScrollView horizontal style={styles.templateContainer}>
              {COMMON_INSTRUCTION_TEMPLATES.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => handleAddInstructionTemplate(template)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>指令JSON</Text>
            <TextInput
              mode="outlined"
              multiline
              value={instructionJson}
              onChangeText={setInstructionJson}
              style={styles.jsonInput}
              placeholder="输入任务指令JSON..."
              contentStyle={{ fontFamily: 'monospace' }}
            />

            <Text style={styles.sectionTitle}>指令说明</Text>
            <View style={styles.instructionHelp}>
              <Text style={styles.helpText}>
                • launch_app: 启动应用 (packageName: 包名)
              </Text>
              <Text style={styles.helpText}>
                • click: 点击操作 (target: 目标位置)
              </Text>
              <Text style={styles.helpText}>
                • swipe: 滑动操作 (direction: 方向)
              </Text>
              <Text style={styles.helpText}>
                • input_text: 输入文本 (text: 输入内容)
              </Text>
              <Text style={styles.helpText}>
                • wait: 等待 (duration: 毫秒数)
              </Text>
              <Text style={styles.helpText}>
                • log: 日志 (level: 级别, message: 消息)
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setInstructionEditorVisible(false)}
              style={styles.cancelButton}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveInstruction}
              style={styles.saveButton}
            >
              保存
            </Button>
          </View>
        </View>
      </Modal>
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
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  instructionCount: {
    fontSize: 12,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusLabelText: {
    fontSize: 12,
    marginRight: 8,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBar: {
    margin: 16,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  instructionEditorContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  templateContainer: {
    marginBottom: 20,
  },
  templateItem: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  jsonInput: {
    minHeight: 200,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  instructionHelp: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
});
