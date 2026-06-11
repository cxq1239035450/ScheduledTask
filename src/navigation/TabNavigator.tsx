import React from 'react';
import { useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';

import TaskScreen from '../modules/Task/index.tsx';
import LogsScreen from '../modules/Logs/index.tsx';
import SetScreen from '../modules/Set/index.tsx';

const Tab = createBottomTabNavigator();

const iconMap: Record<string, string> = {
  TaskScreen: 'format-list-bulleted',
  LogsScreen: 'history',
  SetScreen: 'settings',
};

export default function TabNavigator() {
  const isDark = useColorScheme() === 'dark';
  const activeColor = isDark ? '#4FC3F7' : '#1A73E8';
  const inactiveColor = isDark ? '#888888' : '#999999';
  const backgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? '#333333' : '#EEEEEE';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 0.5,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 56,
          paddingTop: 4,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => (
          <Icon source={iconMap[route.name] || 'help-circle'} color={color} size={24} />
        ),
      })}
    >
      <Tab.Screen name="TaskScreen" component={TaskScreen} options={{ title: '任务' }} />
      <Tab.Screen name="LogsScreen" component={LogsScreen} options={{ title: '日志' }} />
      <Tab.Screen name="SetScreen" component={SetScreen} options={{ title: '设置' }} />
    </Tab.Navigator>
  );
}
