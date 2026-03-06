/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BackgroundTaskManager from './src/utils/BackgroundTaskManager';

// 注册 Headless JS 任务
const BackgroundTask = async (data) => {
    const { taskId } = data;
    console.log(`HeadlessJS: Received background task: ${taskId}`);
    // BackgroundTaskManager 已经是单例实例，直接调用即可
    await BackgroundTaskManager.executeTaskById(taskId);
};

AppRegistry.registerHeadlessTask('BackgroundTask', () => BackgroundTask);
AppRegistry.registerComponent(appName, () => App);
