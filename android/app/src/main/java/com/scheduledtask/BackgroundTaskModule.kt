package com.scheduledtask

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
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
    fun startService(options: ReadableMap, promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, ForegroundRunningService::class.java)

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
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("BackgroundTaskModule", "Failed to start foreground service", e)
            promise.reject("START_SERVICE_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, ForegroundRunningService::class.java)
            val stopped = context.stopService(intent)
            Log.d("BackgroundTaskModule", "Foreground service stop requested: $stopped")
            promise.resolve(stopped)
        } catch (e: Exception) {
            Log.e("BackgroundTaskModule", "Failed to stop foreground service", e)
            promise.reject("STOP_SERVICE_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(ForegroundRunningService.isServiceActive)
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
