import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { Text, List, IconButton, Divider, Chip, Appbar, Card, Button } from 'react-native-paper';
import LogManager, { LogEntry } from '../../utils/LogManager';

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTask, setSelectedTask] = useState<{ title: string; logs: LogEntry[] } | null>(null);

  useEffect(() => {
    // 订阅日志变化
    const unsubscribe = LogManager.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: LogEntry[] } = {};
    logs.forEach(log => {
      const title = log.taskTitle || '系统日志';
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(log);
    });
    
    // 按最新日志时间排序
    return Object.entries(groups).map(([title, taskLogs]) => ({
      title,
      logs: taskLogs,
      latestLog: taskLogs[0], // 假设日志已按时间倒序排列
    })).sort((a, b) => (b.latestLog?.timestamp || 0) - (a.latestLog?.timestamp || 0));
  }, [logs]);

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

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert';
      default: return 'information';
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#FF5252';
      case 'warning': return '#FFC107';
      default: return '#2196F3';
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
    <Card 
      style={styles.card} 
      onPress={() => setSelectedTask(item)}
      mode="elevated"
    >
      <Card.Title
        title={item.title}
        titleStyle={styles.cardTitle}
        right={(props) => (
          <Text style={styles.logCount}>{item.logs.length} 条记录</Text>
        )}
      />
      <Card.Content>
        <View style={styles.latestLogContainer}>
          <List.Icon 
            icon={getLogIcon(item.latestLog.type)} 
            color={getLogColor(item.latestLog.type)}
            style={styles.latestLogIcon}
          />
          <View style={styles.latestLogTextContainer}>
            <Text 
              numberOfLines={2} 
              style={[styles.latestLogMessage, { color: getLogColor(item.latestLog.type) }]}
            >
              {item.latestLog.message}
            </Text>
            <Text style={styles.latestLogTime}>
              最新执行：{formatDate(item.latestLog.timestamp)} {formatTime(item.latestLog.timestamp)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="运行日志" titleStyle={styles.title} />
        <Appbar.Action icon="delete-outline" onPress={handleClearLogs} disabled={logs.length === 0} />
      </Appbar.Header>

      <FlatList
        data={groupedLogs}
        keyExtractor={(item) => item.title}
        renderItem={renderTaskCard}
        contentContainerStyle={groupedLogs.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="clipboard-text-outline" size={64} iconColor="#CCC" />
            <Text style={styles.emptyText}>暂无运行日志</Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedTask}
        onDismiss={() => setSelectedTask(null)}
        onRequestClose={() => setSelectedTask(null)}
        animationType="fade"
        transparent={true}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedTask(null)}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
              <IconButton 
                icon="close" 
                size={24} 
                onPress={() => setSelectedTask(null)} 
              />
            </View>
            <Divider />
            <ScrollView style={styles.modalScroll}>
              {selectedTask?.logs.map((log, index) => (
                <View key={log.id}>
                  <List.Item
                    title={log.message}
                    titleStyle={[styles.logMessage, { color: getLogColor(log.type) }]}
                    description={
                      <View style={styles.logDescription}>
                        <Text style={styles.logTime}>
                          {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                        </Text>
                      </View>
                    }
                    left={props => (
                      <List.Icon 
                        {...props} 
                        icon={getLogIcon(log.type)} 
                        color={getLogColor(log.type)} 
                      />
                    )}
                  />
                  {index < (selectedTask?.logs.length || 0) - 1 && <Divider />}
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button mode="contained" onPress={() => setSelectedTask(null)} style={styles.closeButton}>
                关闭
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  appbar: {
    backgroundColor: '#FFF',
    elevation: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logCount: {
    fontSize: 12,
    color: '#999',
    marginRight: 16,
  },
  latestLogContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -8,
  },
  latestLogIcon: {
    margin: 0,
    width: 24,
    height: 24,
  },
  latestLogTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  latestLogMessage: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  latestLogTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logMessage: {
    fontSize: 14,
    fontWeight: '500',
  },
  logDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    paddingHorizontal: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  closeButton: {
    borderRadius: 8,
  },
});
