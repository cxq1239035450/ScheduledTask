import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, NativeModules, Alert, Modal, ScrollView, PermissionsAndroid, Platform } from 'react-native';
import { Icon, FAB, Card, Switch, Button, List, Searchbar, Divider } from 'react-native-paper';
import BackgroundTimer from 'react-native-background-timer';
import BackgroundTaskManager from '../../utils/BackgroundTaskManager';
import LogManager from '../../utils/LogManager';

const { WakeScreenModule, TouchSimulationModule, AppLauncherModule } = NativeModules;

interface AppInfo {
  label: string;
  packageName: string;
  userId: number;
}

// 模拟任务数据
const MOCK_TASKS = [
  { id: '1', title: '模拟钉钉打卡', time: '08:32', status: 'running', type: 'daily' },
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

function TaskItem({ item, onToggle }: { item: typeof MOCK_TASKS[0], onToggle: (id: string) => void }) {
  const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
  
  // Switch 开启状态：运行中或异常
  const isSwitchOn = item.status !== 'stopped';

  return (
    <Card style={styles.taskCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={styles.timeRow}>
            <Icon source="clock-outline" size={14} color="#666" />
            <Text style={styles.taskTime}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.statusAction}>
          <Text style={[styles.statusLabelText, { color: config.color }]}>
            {/* {config.label} */}
          </Text>
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
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [isAppPickerVisible, setAppPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        // 简单的切换逻辑：如果未运行则变为运行中，否则变为未运行
        return {
          ...task,
          status: task.status === 'stopped' ? 'running' : 'stopped'
        };
      }
      return task;
    }));
  };

  const scheduleWakeup = (minutes: number) => {
    const ms = minutes * 1000;
    
    LogManager.addLog(`设置 ${minutes} 分钟后自动亮屏任务`, 'info', '测试任务');
    console.log(`Setting background timer for ${minutes} minutes (${ms}ms)...`);
    Alert.alert('已设置', `系统将在 ${minutes} 分钟后自动亮屏。请保持应用在后台运行，不要彻底关闭。`);

    BackgroundTimer.setTimeout(() => {
      LogManager.addLog('触发定时器，正在唤醒屏幕...', 'info', '测试任务');
      console.log('Background timer triggered! Calling native wakeScreen...');
      WakeScreenModule.wakeScreen();
      
      // 亮屏后延迟 1 秒执行上滑动作
      BackgroundTimer.setTimeout(() => {
        LogManager.addLog('正在模拟上滑动作...', 'info', '测试任务');
        console.log('Calling native TouchSimulationModule.simulateSwipeUp...');
        TouchSimulationModule.simulateSwipeUp();
        LogManager.addLog('上滑动作已执行', 'success', '测试任务');
      }, 1000);
      
    }, ms);
  };
// 申请 Android 前台服务权限
const requestForegroundPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      // Android 13+ 必须申请通知权限，否则前台服务无法弹出通知会导致系统直接杀掉进程
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: '通知权限申请',
          message: 'App需要显示通知权限，才能在后台持续运行定时任务',
          buttonPositive: '允许',
          buttonNegative: '取消',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
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

  const handleLaunchApp = (packageName: string, userId: number = 0) => {
    LogManager.addLog(`尝试启动应用: ${packageName} (UID: ${userId})`, 'info');
    AppLauncherModule.launchApp(packageName, userId);
  };

  const openAppPicker = async () => {
    try {
      const apps = await AppLauncherModule.getInstalledApps();
      setInstalledApps(apps);
      setFilteredApps(apps);
      setAppPickerVisible(true);
    } catch (e) {
      Alert.alert('错误', '无法获取应用列表');
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
        renderItem={({ item }) => <TaskItem item={item} onToggle={handleToggle} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log('Add Task')}
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  statusAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
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
});
