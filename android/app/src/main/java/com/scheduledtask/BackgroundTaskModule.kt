package com.scheduledtask

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableArray
import android.content.Intent
import android.os.Build
import android.util.Log

class BackgroundTaskModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BackgroundTaskModule"
    }

    @ReactMethod
    fun syncTasks(tasks: ReadableArray) {
        val context = reactApplicationContext
        val intent = Intent(context, ForegroundRunningService::class.java).apply {
            action = "SYNC_TASKS"
            // 将任务列表转换为 JSON 字符串传递给 Service，或者通过更复杂的序列化。
            // 简单起见，这里将 ReadableArray 转换为 ArrayList<String> 传递。
            val taskList = ArrayList<String>()
            for (i in 0 until tasks.size()) {
                val task = tasks.getMap(i)
                val taskId = task?.getString("id")
                val taskTime = task?.getString("time")
                if (taskId != null && taskTime != null) {
                    taskList.add("$taskId|$taskTime")
                }
            }
            putStringArrayListExtra("taskList", taskList)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        Log.d("BackgroundTaskModule", "Tasks synced to native service")
    }

    @ReactMethod
    fun startService(options: ReadableMap) {
        val context = reactApplicationContext
        val intent = Intent(context, ForegroundRunningService::class.java)
        
        // 将 options 中的参数传递给 Service
        if (options.hasKey("taskTitle")) {
            intent.putExtra("taskTitle", options.getString("taskTitle"))
        }
        if (options.hasKey("taskDesc")) {
            intent.putExtra("taskDesc", options.getString("taskDesc"))
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        Log.d("BackgroundTaskModule", "Foreground service start requested")
    }

    @ReactMethod
    fun stopService() {
        val context = reactApplicationContext
        val intent = Intent(context, ForegroundRunningService::class.java)
        context.stopService(intent)
        Log.d("BackgroundTaskModule", "Foreground service stop requested")
    }

    @ReactMethod
    fun updateNotification(options: ReadableMap) {
        val context = reactApplicationContext
        val intent = Intent(context, ForegroundRunningService::class.java)
        intent.action = "UPDATE_NOTIFICATION"
        
        if (options.hasKey("taskTitle")) {
            intent.putExtra("taskTitle", options.getString("taskTitle"))
        }
        if (options.hasKey("taskDesc")) {
            intent.putExtra("taskDesc", options.getString("taskDesc"))
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }
}
