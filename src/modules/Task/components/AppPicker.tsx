import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Searchbar, List } from 'react-native-paper';

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
  const isDark = useColorScheme() === 'dark';

  const c = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    secondary: isDark ? '#888888' : '#999999',
    separator: isDark ? '#333333' : '#EEEEEE',
    primary: isDark ? '#4FC3F7' : '#1A73E8',
    searchBg: isDark ? '#2C2C2C' : '#F0F0F0',
  };

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

  const selectApp = (packageName: string, userId: number) => {
    onAppSelect(packageName, userId);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: c.bg }]}>
          <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.separator }]}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.headerButton, { color: c.secondary }]}>取消</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: c.text }]}>选择应用</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={[styles.searchContainer, { backgroundColor: c.surface }]}>
            <Searchbar placeholder="搜索应用" onChangeText={(query) => setSearchQuery(query)} value={searchQuery}
              style={[styles.searchBar, { backgroundColor: c.searchBg }]} inputStyle={{ color: c.text, fontSize: 14 }}
              placeholderTextColor={c.secondary} iconColor={c.secondary} />
          </View>

          <FlatList data={filteredApps} keyExtractor={(item) => item.packageName + item.userId}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.appItem, { backgroundColor: c.surface, borderBottomColor: c.separator }]} onPress={() => selectApp(item.packageName, item.userId)} activeOpacity={0.7}>
                <View style={[styles.appIcon, { backgroundColor: c.primary + '15' }]}>
                  <List.Icon icon="android" color={c.primary} style={{ margin: 0 }} />
                </View>
                <View style={styles.appInfo}>
                  <Text style={[styles.appName, { color: c.text }]} numberOfLines={1}>{item.label}</Text>
                  <Text style={[styles.appPackage, { color: c.secondary }]} numberOfLines={1}>{item.packageName}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.appList}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerButton: { fontSize: 15, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5 },
  searchBar: { elevation: 0, borderRadius: 12, height: 36 },
  appList: { flex: 1 },
  appItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  appIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '500' },
  appPackage: { fontSize: 12, marginTop: 2 },
});
