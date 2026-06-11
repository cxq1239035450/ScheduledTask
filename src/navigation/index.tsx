// src/navigation/index.tsx （路由入口）
import React, { useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 页面组件
import LoginScreen from '../modules/Login';
import TabNavigator from './TabNavigator';

// 登录状态上下文
interface AuthContextType {
  isLogin: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLogin: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// 1. 创建导航实例
const Stack = createNativeStackNavigator();

// 2. 定义根导航（包含登录/已登录状态）
const RootNavigator = () => {
  const { isLogin } = useAuth();

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
  const [isLogin, setIsLogin] = useState(true); // 默认设置为 true 方便查看主页

  const login = () => setIsLogin(true);
  const logout = () => setIsLogin(false);

  return (
    <AuthContext.Provider value={{ isLogin, login, logout }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
