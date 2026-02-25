import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


import Task from '../modules/Task/index.tsx';
import SetScreen from '../modules/set/index.tsx';
import { Icon } from 'react-native-paper';



const Tab = createBottomTabNavigator();


// 2. 定义Tab导航（核心页面）
export default function TabNavigator() {
  return (
    <Tab.Navigator
      // Tab样式配置
      screenOptions={{
        tabBarActiveTintColor: '#0088ff', // 选中颜色
        tabBarInactiveTintColor: '#999', // 未选中颜色
        headerShown: false, // 隐藏Tab页面的顶部导航栏
      }}
    >
      <Tab.Screen
        name="Task"
        component={Task}
        options={{
          title: '任务列表',
          tabBarIcon: ({ color, size }) => (
            <Icon source="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SetScreen"
        component={SetScreen}
        options={{
          title: '日志',
          tabBarIcon: ({ color, size }) => (
            <Icon source="history" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};