import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Button, List, Searchbar, Divider, Icon } from 'react-native-paper';

interface AppInfo {
  label: string;
  packageName: string;
  userId: number;
}

interface AppPickerProps {
  visible: boolean;
  onClose: () => void;
  onAppSelect: (packageName: string, userId: number) => void;
  installedApps: AppInfo[];
}

export const AppPicker: React.FC<AppPickerProps> = ({
  visible,
  onClose,
  onAppSelect,
  installedApps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredApps, setFilteredApps] = useState<AppInfo[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = installedApps.filter(app => 
        app.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(installedApps);
    }
  }, [searchQuery, installedApps]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const selectApp = (packageName: string, userId: number) => {
    onAppSelect(packageName, userId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>选择应用</Text>
          <Button onPress={onClose}>关闭</Button>
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
          style={styles.appList}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  appList: {
    flex: 1,
  },
});