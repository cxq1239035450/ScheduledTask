import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, NativeModules, Alert } from 'react-native';
import { Icon, FAB, Card, Switch, Button } from 'react-native-paper';
import BackgroundTimer from 'react-native-background-timer';

const { WakeScreenModule } = NativeModules;

// 模拟任务数据
const MOCK_TASKS = [
  { id: '1', title: '每日早起打卡', time: '08:00', status: 'running', type: 'daily' },
  { id: '2', title: '每周周报整理', time: '周五 18:00', status: 'running', type: 'weekly' },
  { id: '3', title: '系统备份任务', time: '02:00', status: 'error', type: 'system' },
  { id: '4', title: '数据同步', time: '每小时', status: 'stopped', type: 'sync' },
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
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (countdown !== null && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
    }
    return () => clearInterval(interval);
  }, [countdown]);

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
    const ms = minutes * 60 * 1000;
    const seconds = minutes * 60;
    
    console.log(`Setting background timer for ${minutes} minutes (${ms}ms)...`);
    Alert.alert('已设置', `系统将在 ${minutes} 分钟后自动亮屏。请保持应用在后台运行，不要彻底关闭。`);
    setCountdown(seconds);

    BackgroundTimer.setTimeout(() => {
      console.log('Background timer triggered! Calling native wakeScreen...');
      WakeScreenModule.wakeScreen();
      setCountdown(null);
    }, ms);
  };

  const testWakeNow = () => {
    console.log('Testing wake screen now...');
    if (!WakeScreenModule) {
      console.error('WakeScreenModule is not defined!');
      Alert.alert('错误', '原生模块未加载，请检查是否重新编译了应用。');
      return;
    }
    // 延迟 3 秒，方便用户手动锁屏测试
    Alert.alert('测试', '请在 3 秒内手动锁屏，观察是否会亮起。');
    setTimeout(() => {
      console.log('3 seconds up, calling WakeScreenModule.wakeScreen()...');
      WakeScreenModule.wakeScreen();
    }, 3000);
  };

  const handleOpenSettings = () => {
    WakeScreenModule.openSettings();
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
          disabled={countdown !== null}
        >
          {countdown !== null 
            ? `亮屏倒计时: ${Math.floor(countdown / 60)}分${countdown % 60}秒` 
            : '10分钟后自动亮屏'}
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={testWakeNow}
          icon="flash-outline"
          style={[styles.wakeButton, { marginTop: 8 }]}
        >
          立即测试亮屏 (3秒延迟)
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
      </View>

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
});
