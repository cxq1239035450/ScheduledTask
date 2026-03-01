import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, List, IconButton, Divider, Chip, Appbar } from 'react-native-paper';
import LogManager, { LogEntry } from '../../utils/LogManager';

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // 订阅日志变化
    const unsubscribe = LogManager.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

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

  const renderItem = ({ item }: { item: LogEntry }) => (
    <List.Item
      title={item.message}
      titleStyle={[styles.logMessage, { color: getLogColor(item.type) }]}
      description={
        <View style={styles.logDescription}>
          <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
          {item.taskTitle && (
            <Chip compact style={styles.taskChip} textStyle={styles.taskChipText}>
              {item.taskTitle}
            </Chip>
          )}
        </View>
      }
      left={props => (
        <List.Icon 
          {...props} 
          icon={getLogIcon(item.type)} 
          color={getLogColor(item.type)} 
        />
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="运行日志" titleStyle={styles.title} />
        <Appbar.Action icon="delete-outline" onPress={handleClearLogs} disabled={logs.length === 0} />
      </Appbar.Header>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={logs.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="clipboard-text-outline" size={64} iconColor="#CCC" />
            <Text style={styles.emptyText}>暂无运行日志</Text>
          </View>
        }
      />
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
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
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
    marginRight: 8,
  },
  taskChip: {
    height: 20,
    backgroundColor: '#E8EAF6',
  },
  taskChipText: {
    fontSize: 10,
    marginVertical: 0,
    color: '#3F51B5',
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
});
