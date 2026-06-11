import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  NativeModules,
  Alert,
  PermissionsAndroid,
  Platform,
  Permission,
  useColorScheme,
} from 'react-native';
import {
  Icon,
  FAB,
  Switch,
  IconButton,
} from 'react-native-paper';
import BackgroundTaskManager from '../../utils/BackgroundTaskManager';
import LogManager, { LogEntry } from '../../utils/LogManager';
import AppManager from '../../utils/AppManager';
import { Task, TaskInstruction } from '../../types/TaskInstruction';
import { InstructionEditor } from './components/InstructionEditor';
import { AppPicker } from './components/AppPicker';
import { CreateTaskModal } from './components/CreateTaskModal';

const { WakeScreenModule, TouchSimulationModule } = NativeModules;

interface AppInfo {
  label: string;
  packageName: string;
  userId: number;
}

const EXAMPLE_TASKS: Task[] = [
  {
    id: '1',
    name: '钉钉自动打卡',
    description: '早上8:32自动打卡',
    time: '22:35',
    status: 'running',
    type: 'daily',
    enabled: true,
    instruction: [
      { id: 'wake_up_1', type: 'wake_up' },
      { id: 'swipe_up_1', type: 'swipe', parameters: { direction: 'up', duration: 300 }, delay: 1000 },
      { id: 'launch_dingtalk_1', type: 'launch_app', parameters: { packageName: 'com.alibaba.android.rimet', userId: 0 }, delay: 2000 },
      { id: 'close_dingtalk_1', type: 'close_app', parameters: { packageName: 'com.alibaba.android.rimet', userId: 0 }, delay: 2000 },
    ],
  },
  {
    id: '2',
    name: '钉钉自动打卡',
    description: '下午18:33自动打卡',
    time: '18:33',
    status: 'running',
    type: 'daily',
    enabled: true,
    instruction: [
      { id: 'wake_up_2', type: 'wake_up', delay: 1000 },
      { id: 'launch_dingtalk_1', type: 'launch_app', parameters: { packageName: 'com.alibaba.android.rimet', userId: 0 } },
      { id: 'close_dingtalk_1', type: 'close_app', parameters: { packageName: 'com.alibaba.android.rimet', userId: 0 } },
    ],
  },
];

interface TaskStats {
  running: number;
  todayTriggered: number;
  errors: number;
}

function TaskHeader({ stats }: { stats: TaskStats }) {
  const isDark = useColorScheme() === 'dark';
  const c = {
    bg: isDark ? '#1E1E1E' : '#FFFFFF',
    statBg: isDark ? '#2C2C2C' : '#F5F5F5',
    primary: isDark ? '#4FC3F7' : '#1A73E8',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#888888' : '#999999',
    destructive: isDark ? '#FF6B6B' : '#F44336',
    divider: isDark ? '#333333' : '#EEEEEE',
  };
  return (
    <View style={[st.header, { backgroundColor: c.bg }]}>
      <View style={[st.statBox, { backgroundColor: c.statBg }]}>
        <View style={st.statItem}>
          <Text style={[st.statValue, { color: c.primary }]}>{stats.running}</Text>
          <Text style={[st.statLabel, { color: c.secondary }]}>运行中</Text>
        </View>
        <View style={[st.statDivider, { backgroundColor: c.divider }]} />
        <View style={st.statItem}>
          <Text style={[st.statValue, { color: c.text }]}>{stats.todayTriggered}</Text>
          <Text style={[st.statLabel, { color: c.secondary }]}>今日触发</Text>
        </View>
        <View style={[st.statDivider, { backgroundColor: c.divider }]} />
        <View style={st.statItem}>
          <Text style={[st.statValue, { color: c.destructive }]}>{stats.errors}</Text>
          <Text style={[st.statLabel, { color: c.secondary }]}>异常</Text>
        </View>
      </View>
    </View>
  );
}

function TaskItem({ item, onToggle, onEdit, onExecute, onDelete }: {
  item: Task; onToggle: (id: string) => void; onEdit: (task: Task) => void;
  onExecute: (task: Task) => void; onDelete: (id: string) => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const c = {
    bg: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#888888' : '#999999',
    primary: isDark ? '#4FC3F7' : '#1A73E8',
    destructive: isDark ? '#FF6B6B' : '#F44336',
    success: isDark ? '#66BB6A' : '#4CAF50',
  };
  return (
    <View style={[st.card, { backgroundColor: c.bg }]}>
      <View style={st.cardBody}>
        <View style={st.titleRow}>
          <Text style={[st.cardTitle, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
          <Switch value={item.status !== 'stopped'} onValueChange={() => onToggle(item.id)} color={c.primary} />
        </View>
        {item.description && (
          <Text style={[st.cardDesc, { color: c.secondary }]} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={st.cardFooter}>
          <TouchableOpacity style={st.timeInfo} onPress={() => onEdit(item)}>
            <Icon source="clock-outline" size={14} color={c.secondary} />
            <Text style={[st.taskTime, { color: c.primary }]}>{item.time}</Text>
            <Text style={[st.instrCount, { color: c.secondary }]}> · {item.instruction.length} 个指令</Text>
          </TouchableOpacity>
          <View style={st.actions}>
            <IconButton icon="pencil-outline" size={18} iconColor={c.secondary} onPress={() => onEdit(item)} style={st.iconBtn} />
            <IconButton icon="delete-outline" size={18} iconColor={c.destructive} onPress={() => onDelete(item.id)} style={st.iconBtn} />
            <IconButton icon="play" size={18} iconColor={c.success} onPress={() => onExecute(item)} style={st.iconBtn} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ running: 0, todayTriggered: 0, errors: 0 });
  const [isAppPickerVisible, setAppPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [isInstructionEditorVisible, setInstructionEditorVisible] = useState(false);
  const [isCreateTaskModalVisible, setCreateTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const tasksRef = useRef<Task[]>([]);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    const loadData = async () => {
      setTimeout(() => {
        const loadedTasks = BackgroundTaskManager.getAllTasks();
        if (loadedTasks.length > 0) {
          setTasks(loadedTasks);
          tasksRef.current = loadedTasks;
        } else {
          setTasks(EXAMPLE_TASKS);
          tasksRef.current = EXAMPLE_TASKS;
          EXAMPLE_TASKS.forEach(task => BackgroundTaskManager.addTask(task));
        }
      }, 500);
    };
    loadData();
    const unsubscribeLogs = LogManager.subscribe((logs) => calculateStats(tasksRef.current, logs));
    return () => unsubscribeLogs();
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
    LogManager.getLogs().then(logs => calculateStats(tasks, logs));
  }, [tasks]);

  const calculateStats = (currentTasks: Task[], logs: LogEntry[]) => {
    const startOfDay = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const todayLogs = logs.filter(l => l.timestamp >= startOfDay);
    setStats({
      running: currentTasks.filter(t => t.enabled).length,
      todayTriggered: todayLogs.filter(l => l.message.includes('执行定时任务') || l.message.includes('任务执行成功')).length,
      errors: todayLogs.filter(l => l.type === 'error').length,
    });
  };

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== id) return task;
      const newStatus = task.status === 'stopped' ? 'running' : 'stopped';
      if (newStatus === 'running') BackgroundTaskManager.enableTask(id);
      else BackgroundTaskManager.disableTask(id);
      return { ...task, status: newStatus, enabled: newStatus === 'running' };
    }));
  };

  const handleEditTask = (task: Task) => { setEditingTask(task); setCreateTaskModalVisible(true); };

  const handleDeleteTask = (id: string) => {
    Alert.alert('确认删除', '确定要删除这个任务吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => { setTasks(prev => prev.filter(t => t.id !== id)); BackgroundTaskManager.removeTask(id); } },
    ]);
  };

  const handleClearAllTasks = () => {
    Alert.alert('确认清空', '确定要清空所有任务吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '全部清空', style: 'destructive', onPress: () => { setTasks([]); BackgroundTaskManager.clearTasks(); } },
    ]);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id'>, id?: string) => {
    if (id) {
      const updated = { ...taskData, id };
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      BackgroundTaskManager.addTask(updated);
    } else {
      const newTask = { ...taskData, id: Date.now().toString() };
      setTasks(prev => [...prev, newTask]);
      BackgroundTaskManager.addTask(newTask);
    }
    setEditingTask(null);
  };

  const handleExecuteTask = async (task: Task) => {
    try {
      await requestForegroundPermission();
      BackgroundTaskManager.executeTaskById(task.id);
    } catch (error: any) {
      Alert.alert('执行失败', error.message);
    }
  };

  const handleSaveInstructions = (instructions: TaskInstruction[]) => {
    if (!editingTask) return;
    const updatedTask = { ...editingTask, instruction: instructions };
    setTasks(prev => prev.map(task => task.id === editingTask.id ? updatedTask : task));
    BackgroundTaskManager.addTask(updatedTask);
    setInstructionEditorVisible(false);
    setEditingTask(null);
  };

  const requestForegroundPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const perms: Permission[] = [];
        if (Platform.Version >= 33) perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (perms.length > 0) await PermissionsAndroid.requestMultiple(perms);
        if (WakeScreenModule?.requestIgnoreBatteryOptimizations) WakeScreenModule.requestIgnoreBatteryOptimizations();
        return true;
      } catch { return false; }
    }
    return true;
  };

  const cronSchedule = async () => {
    if (BackgroundTaskManager.isServiceRunning()) {
      await BackgroundTaskManager.stop();
    } else {
      const ok = await requestForegroundPermission();
      if (!ok) { Alert.alert('权限不足', '未获取前台服务权限'); return; }
      await BackgroundTaskManager.start();
    }
  };

  const handleLaunchApp = async (packageName: string, userId: number = 0) => {
    await AppManager.launchApp(packageName, userId);
  };

  const openCommonAppsPicker = async () => {
    try {
      const apps = await AppManager.getCommonApps();
      setInstalledApps(apps);
      setAppPickerVisible(true);
    } catch (e: unknown) {
      Alert.alert('错误', `无法获取常用应用列表: ${e}`);
    }
  };

  const selectApp = (packageName: string, userId: number) => {
    setAppPickerVisible(false);
    handleLaunchApp(packageName, userId);
  };

  return (
    <View style={[st.page, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <TaskHeader stats={stats} />
      <View style={st.actions_section}>
        <TouchableOpacity
          style={[st.primaryBtn, { backgroundColor: isDark ? '#4FC3F7' : '#1A73E8' }]}
          onPress={cronSchedule} activeOpacity={0.8}
        >
          <Icon source="timer-outline" size={20} color="#FFF" />
          <Text style={st.primaryBtnText}>启动后台通知服务</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.linkBtn} onPress={() => TouchSimulationModule.openAccessibilitySettings()} activeOpacity={0.7}>
          <Text style={[st.linkBtnText, { color: isDark ? '#FFB74D' : '#FF9800' }]}>模拟上滑失败？去开启"辅助功能"服务</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.linkBtn} onPress={openCommonAppsPicker} activeOpacity={0.7}>
          <Text style={[st.linkBtnText, { color: isDark ? '#FFB74D' : '#FF9800' }]}>从常用应用选择并打开</Text>
        </TouchableOpacity>
      </View>

      <AppPicker visible={isAppPickerVisible} onClose={() => setAppPickerVisible(false)} onAppSelect={selectApp} installedApps={installedApps} />

      <View style={st.listHeader}>
        <Text style={[st.listTitle, { color: isDark ? '#FFF' : '#1A1A1A' }]}>任务列表</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleClearAllTasks} style={{ marginRight: 16 }}>
            <Text style={[st.filterText, { color: '#F44336' }]}>清空全部</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[st.filterText, { color: isDark ? '#4FC3F7' : '#1A73E8' }]}>全部任务</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskItem item={item} onToggle={handleToggle} onEdit={handleEditTask} onExecute={handleExecuteTask} onDelete={handleDeleteTask} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB icon="plus" style={[st.fab, { backgroundColor: isDark ? '#4FC3F7' : '#1A73E8' }]} color="#FFF" onPress={() => setCreateTaskModalVisible(true)} />
      <CreateTaskModal visible={isCreateTaskModalVisible} onClose={() => { setCreateTaskModalVisible(false); setEditingTask(null); }} onSave={handleSaveTask} editTask={editingTask} />
      <InstructionEditor visible={isInstructionEditorVisible} onClose={() => { setInstructionEditorVisible(false); setEditingTask(null); }} onSave={handleSaveInstructions} task={editingTask} initialInstructions={editingTask?.instruction || []} />
    </View>
  );
}

const st = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  statBox: { flexDirection: 'row', borderRadius: 16, padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  statDivider: { width: 1, height: 30 },
  actions_section: { padding: 16, paddingTop: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 24, gap: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  linkBtn: { paddingVertical: 12, paddingHorizontal: 4 },
  linkBtnText: { fontSize: 13, fontWeight: '500' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  listTitle: { fontSize: 20, fontWeight: '700' },
  filterText: { fontSize: 14, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { marginBottom: 12, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardBody: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 12 },
  cardDesc: { fontSize: 13, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  timeInfo: { flexDirection: 'row', alignItems: 'center' },
  taskTime: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  instrCount: { fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { margin: 0, width: 32, height: 32 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, borderRadius: 28, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
});
