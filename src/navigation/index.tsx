// src/navigation/index.tsx （路由入口）
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 页面组件
import LoginScreen from '../modules/login';
import TabNavigator from './TabNavigator';

// 1. 创建导航实例
const Stack = createNativeStackNavigator();

// 2. 定义根导航（包含登录/已登录状态）
const RootNavigator = () => {
  // 模拟登录状态（实际项目建议从 Context/Redux 获取）
  const [isLogin, _] = useState(true); // 默认设置为 true 方便查看主页

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLogin ? (
        /* 未登录：显示登录页 */
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        /* 已登录：显示Tab导航（核心页面） */
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

// 3. 路由出口
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
