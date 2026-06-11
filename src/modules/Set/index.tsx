import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, NativeModules, TouchableOpacity, useColorScheme } from 'react-native';
import { List, Switch, Text } from 'react-native-paper';
import BackgroundTaskManager from '../../utils/BackgroundTaskManager';
import LogManager from '../../utils/LogManager';

const { WakeScreenModule, TouchSimulationModule } = NativeModules;

export default function SetScreen() {
  const [isServiceRunning, setIsServiceRunning] = useState(false);
  const isDark = useColorScheme() === 'dark';

  const c = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#888888' : '#999999',
    separator: isDark ? '#333333' : '#EEEEEE',
    primary: isDark ? '#4FC3F7' : '#1A73E8',
    destructive: isDark ? '#FF6B6B' : '#F44336',
    success: isDark ? '#66BB6A' : '#4CAF50',
    warning: '#FF9800',
  };

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
      Alert.alert('提示', '请在系统设置中手动开启"辅助功能"');
    }
  };

  const handleOpenBatteryOptimization = () => {
    if (WakeScreenModule?.requestIgnoreBatteryOptimizations) {
      WakeScreenModule.requestIgnoreBatteryOptimizations();
    } else {
      Alert.alert('提示', '请在系统设置中手动关闭"电池优化"');
    }
  };

  const handleClearLogs = () => {
    Alert.alert('确认', '确定要清空所有运行日志吗？', [
      { text: '取消', style: 'cancel' },
      { text: '清空', onPress: () => LogManager.clearLogs(), style: 'destructive' },
    ]);
  };

  const handleClearTasks = () => {
    Alert.alert('确认', '确定要清空所有任务吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      { text: '清空', onPress: () => BackgroundTaskManager.clearTasks(), style: 'destructive' },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('确认', '确定要清除应用缓存吗？这包括运行日志和临时数据。', [
      { text: '取消', style: 'cancel' },
      { text: '清除', onPress: async () => { await LogManager.clearLogs(); Alert.alert('成功', '应用缓存已清除'); }, style: 'destructive' },
    ]);
  };

  const SettingItem = ({ icon, title, description, right, onPress, iconColor = '#1A73E8' }: {
    icon: string; title: string; description?: string; right?: () => React.ReactNode;
    onPress?: () => void; iconColor?: string;
  }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.settingItem, { borderBottomColor: c.separator }]}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <List.Icon icon={icon} color={iconColor} style={{ margin: 0 }} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: c.text }]}>{title}</Text>
          {description && <Text style={[styles.settingDescription, { color: c.secondary }]}>{description}</Text>}
        </View>
        {right && <View style={styles.rightContainer}>{right()}</View>}
        {onPress && !right && <List.Icon icon="chevron-right" color={c.secondary} style={{ margin: 0 }} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarText}>ST</Text>
          </View>
          <Text style={[styles.headerTitle, { color: c.text }]}>设置</Text>
          <Text style={[styles.headerSubtitle, { color: c.secondary }]}>配置您的自动化任务运行环境</Text>
        </View>

        <View style={styles.groupSection}>
          <Text style={[styles.groupLabel, { color: c.secondary }]}>核心运行环境</Text>
          <View style={[styles.groupCard, { backgroundColor: c.surface }]}>
            <SettingItem icon="play-circle-outline" title="后台调度服务" description="保持应用在后台稳定运行" iconColor={c.primary}
              right={() => <Switch value={isServiceRunning} onValueChange={handleToggleService} color={c.primary} />} />
            <SettingItem icon="gesture-tap" title="辅助功能设置" description="模拟点击和滑动操作必开" iconColor="#F44336" onPress={handleOpenAccessibility} />
            <SettingItem icon="battery-charging-10" title="忽略电池优化" description="防止系统后台误杀进程" iconColor="#4CAF50" onPress={handleOpenBatteryOptimization} />
          </View>
        </View>

        <View style={styles.groupSection}>
          <Text style={[styles.groupLabel, { color: c.secondary }]}>数据与清理</Text>
          <View style={[styles.groupCard, { backgroundColor: c.surface }]}>
            <SettingItem icon="cached" title="清除应用缓存" description="清理临时数据和运行日志" iconColor="#FF9800" onPress={handleClearCache} />
            <SettingItem icon="delete-outline" title="清空运行日志" description="仅清理历史执行记录" iconColor="#FF9800" onPress={handleClearLogs} />
            <SettingItem icon="delete-forever-outline" title="清空所有任务" description="移除全部已创建的任务" iconColor="#F44336" onPress={handleClearTasks} />
          </View>
        </View>

        <View style={styles.groupSection}>
          <Text style={[styles.groupLabel, { color: c.secondary }]}>关于</Text>
          <View style={[styles.groupCard, { backgroundColor: c.surface }]}>
            <SettingItem icon="information-outline" title="版本信息" description="v1.0.0 (Build 20240412)" iconColor={c.secondary}
              onPress={() => Alert.alert('关于', '一款高效的定时任务自动执行工具。')} />
            <SettingItem icon="help-circle-outline" title="使用帮助" description="查看常见问题解答" iconColor="#9C27B0"
              onPress={() => Alert.alert('帮助', '如果任务未执行，请检查：\n1. 后台服务是否开启\n2. 辅助功能是否授权\n3. 电池优化是否已忽略')} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.secondary }]}>ScheduledTask © 2024</Text>
          <Text style={[styles.footerSubText, { color: c.secondary }]}>自动化让工作更简单</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  headerSection: { backgroundColor: '#FFF', padding: 24, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '700' },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  groupSection: { marginBottom: 24, paddingHorizontal: 16 },
  groupLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 16 },
  groupCard: { borderRadius: 16, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  iconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingDescription: { fontSize: 12, marginTop: 2 },
  rightContainer: { marginLeft: 8 },
  footer: { padding: 40, alignItems: 'center' },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerSubText: { fontSize: 11, marginTop: 4 },
});
