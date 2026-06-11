import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Modal, TouchableOpacity, useColorScheme } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import LogManager, { LogEntry } from '../../utils/LogManager';

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTask, setSelectedTask] = useState<{ title: string; logs: LogEntry[] } | null>(null);
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
    const unsubscribe = LogManager.subscribe((newLogs) => setLogs(newLogs));
    return () => unsubscribe();
  }, []);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: LogEntry[] } = {};
    logs.forEach(log => {
      const title = log.taskTitle || '系统日志';
      if (!groups[title]) groups[title] = [];
      groups[title].push(log);
    });
    return Object.entries(groups).map(([title, taskLogs]) => ({
      title,
      logs: taskLogs,
      latestLog: taskLogs[0],
    })).sort((a, b) => (b.latestLog?.timestamp || 0) - (a.latestLog?.timestamp || 0));
  }, [logs]);

  const handleClearLogs = () => {
    Alert.alert('确认', '确定要清空所有运行日志吗？', [
      { text: '取消', style: 'cancel' },
      { text: '清空', onPress: () => LogManager.clearLogs(), style: 'destructive' },
    ]);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return c.success;
      case 'error': return c.destructive;
      case 'warning': return c.warning;
      default: return c.primary;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const renderTaskCard = ({ item }: { item: { title: string; logs: LogEntry[]; latestLog: LogEntry } }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface }]}
      onPress={() => setSelectedTask(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.logCount, { color: c.secondary }]}>{item.logs.length} 条</Text>
      </View>
      <View style={styles.latestLogContainer}>
        <View style={[styles.logDot, { backgroundColor: getLogColor(item.latestLog.type) }]} />
        <View style={styles.latestLogTextContainer}>
          <Text numberOfLines={2} style={[styles.latestLogMessage, { color: getLogColor(item.latestLog.type) }]}>
            {item.latestLog.message}
          </Text>
          <Text style={[styles.latestLogTime, { color: c.secondary }]}>
            {formatDate(item.latestLog.timestamp)} {formatTime(item.latestLog.timestamp)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.separator }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>运行日志</Text>
        <TouchableOpacity onPress={handleClearLogs} disabled={logs.length === 0}>
          <Text style={[styles.clearButton, { color: logs.length === 0 ? c.secondary : c.destructive }]}>清空</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groupedLogs}
        keyExtractor={(item) => item.title}
        renderItem={renderTaskCard}
        contentContainerStyle={groupedLogs.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="clipboard-text-outline" size={56} iconColor={c.secondary} />
            <Text style={[styles.emptyText, { color: c.secondary }]}>暂无运行日志</Text>
          </View>
        }
      />

      <Modal visible={!!selectedTask} onDismiss={() => setSelectedTask(null)} onRequestClose={() => setSelectedTask(null)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: c.separator }]}>
              <Text style={[styles.modalTitle, { color: c.text }]} numberOfLines={1}>{selectedTask?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <Text style={[styles.modalClose, { color: c.primary }]}>完成</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedTask?.logs.map((log, index) => (
                <View key={log.id} style={[styles.logItem, index < (selectedTask?.logs.length || 0) - 1 && { borderBottomColor: c.separator }]}>
                  <View style={[styles.logDot, { backgroundColor: getLogColor(log.type), marginTop: 7 }]} />
                  <View style={styles.logContent}>
                    <Text style={[styles.logMessage, { color: c.text }]}>{log.message}</Text>
                    <Text style={[styles.logTime, { color: c.secondary }]}>{formatDate(log.timestamp)} {formatTime(log.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  clearButton: { fontSize: 14, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 20 },
  emptyList: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  logCount: { fontSize: 12 },
  latestLogContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  logDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, marginTop: 6 },
  latestLogTextContainer: { flex: 1 },
  latestLogMessage: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  latestLogTime: { fontSize: 12, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 15, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 16 },
  modalClose: { fontSize: 15, fontWeight: '500' },
  modalScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  logItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5 },
  logContent: { flex: 1, marginLeft: 4 },
  logMessage: { fontSize: 14, fontWeight: '500' },
  logTime: { fontSize: 12, marginTop: 4 },
});
