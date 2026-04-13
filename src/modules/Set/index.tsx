import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, NativeModules, TouchableOpacity } from 'react-native';
import { List, Switch, Divider, Appbar, useTheme, Text, Card, Avatar } from 'react-native-paper';
import BackgroundTaskManager from '../../utils/BackgroundTaskManager';
import LogManager from '../../utils/LogManager';

const { WakeScreenModule, TouchSimulationModule } = NativeModules;

export default function SetScreen() {
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setIsServiceRunning(BackgroundTaskManager.isServiceRunning());
  }, []);

  const handleToggleService = async () => {
    const nextStatus = !isServiceRunning;
    setIsServiceRunning(nextStatus);
    if (!nextStatus) {
      await BackgroundTaskManager.stop();
      Alert.alert('已停止', '后台调度服务已停止');
    } else {
      await BackgroundTaskManager.start();
      Alert.alert('已启动', '后台调度服务已启动');
    }
  };

  const handleOpenAccessibility = () => {
    if (TouchSimulationModule?.openAccessibilitySettings) {
      TouchSimulationModule.openAccessibilitySettings();
    } else {
      Alert.alert('提示', '请在系统设置中手动开启“辅助功能”');
    }
  };

  const handleOpenBatteryOptimization = () => {
    if (WakeScreenModule?.requestIgnoreBatteryOptimizations) {
      WakeScreenModule.requestIgnoreBatteryOptimizations();
    } else {
      Alert.alert('提示', '请在系统设置中手动关闭“电池优化”');
    }
  };

  const handleClearLogs = () => {
    Alert.alert('确认', '确定要清空所有运行日志吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '清空', 
        onPress: () => LogManager.clearLogs(),
        style: 'destructive'
      },
    ]);
  };

  const handleClearTasks = () => {
    Alert.alert('确认', '确定要清空所有任务吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      { 
        text: '清空', 
        onPress: () => BackgroundTaskManager.clearTasks(),
        style: 'destructive'
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('确认', '确定要清除应用缓存吗？这包括运行日志和临时数据。', [
      { text: '取消', style: 'cancel' },
      { 
        text: '清除', 
        onPress: async () => {
          await LogManager.clearLogs();
          // 这里可以添加其他缓存清理逻辑，如 AsyncStorage 的其他 Key
          Alert.alert('成功', '应用缓存已清除');
        },
        style: 'destructive'
      },
    ]);
  };

  const SettingItem = ({ icon, title, description, right, onPress, iconBg = '#E8EAF6', iconColor = '#3F51B5' }: any) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View style={styles.settingItem}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <List.Icon icon={icon} color={iconColor} style={styles.iconStyle} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
        {right && <View style={styles.rightContainer}>{right()}</View>}
        {onPress && !right && (
          <List.Icon icon="chevron-right" color="#CCC" style={styles.chevronStyle} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Avatar.Icon size={64} icon="cog-outline" style={styles.avatar} color="#FFF" />
          <Text style={styles.headerTitle}>设置中心</Text>
          <Text style={styles.headerSubtitle}>配置您的自动化任务运行环境</Text>
        </View>

        <Card style={styles.groupCard}>
          <Text style={styles.groupLabel}>核心运行环境</Text>
          <SettingItem
            icon="run"
            title="后台调度服务"
            description="保持应用在后台稳定运行"
            iconBg="#E3F2FD"
            iconColor="#1976D2"
            right={() => (
              <Switch
                value={isServiceRunning}
                onValueChange={handleToggleService}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="gesture-tap"
            title="辅助功能设置"
            description="模拟点击和滑动操作必开"
            iconBg="#FCE4EC"
            iconColor="#C2185B"
            onPress={handleOpenAccessibility}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="battery-off"
            title="忽略电池优化"
            description="防止系统后台误杀进程"
            iconBg="#E8F5E9"
            iconColor="#388E3C"
            onPress={handleOpenBatteryOptimization}
          />
        </Card>

        <Card style={styles.groupCard}>
          <Text style={styles.groupLabel}>数据与清理</Text>
          <SettingItem
            icon="cached"
            title="清除应用缓存"
            description="清理临时数据和运行日志"
            iconBg="#E1F5FE"
            iconColor="#03A9F4"
            onPress={handleClearCache}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="delete-sweep-outline"
            title="清空运行日志"
            description="仅清理历史执行记录"
            iconBg="#FFF3E0"
            iconColor="#F57C00"
            onPress={handleClearLogs}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="delete-forever-outline"
            title="清空所有任务"
            description="移除全部已创建的任务"
            iconBg="#FFEBEE"
            iconColor="#D32F2F"
            onPress={handleClearTasks}
          />
        </Card>

        <Card style={styles.groupCard}>
          <Text style={styles.groupLabel}>关于</Text>
          <SettingItem
            icon="information-outline"
            title="版本信息"
            description="v1.0.0 (Build 20240412)"
            iconBg="#F5F5F5"
            iconColor="#616161"
            onPress={() => Alert.alert('关于', '一款高效的定时任务自动执行工具。')}
          />
          <Divider style={styles.divider} />
          <SettingItem
            icon="help-circle-outline"
            title="使用帮助"
            description="查看常见问题解答"
            iconBg="#F3E5F5"
            iconColor="#7B1FA2"
            onPress={() => Alert.alert('帮助', '如果任务未执行，请检查：\n1. 后台服务是否开启\n2. 辅助功能是否授权\n3. 电池优化是否已忽略')}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ScheduledTask © 2024</Text>
          <Text style={styles.footerSubText}>自动化让工作更简单</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  appbar: {
    backgroundColor: '#FFF',
    elevation: 0,
  },
  appbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
    elevation: 2,
  },
  avatar: {
    backgroundColor: '#4F46E5',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  groupCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStyle: {
    margin: 0,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: 8,
  },
  chevronStyle: {
    margin: 0,
  },
  divider: {
    marginVertical: 4,
    backgroundColor: '#F0F0F0',
    height: 1,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  footerSubText: {
    color: '#BBB',
    fontSize: 11,
    marginTop: 4,
  },
});
