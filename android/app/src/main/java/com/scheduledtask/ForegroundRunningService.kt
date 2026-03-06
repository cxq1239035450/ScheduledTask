package com.scheduledtask

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * APP前台服务，参考 DailyTask 实现。
 * 用于保持应用在后台运行，降低被系统杀死的可能性。
 */
class ForegroundRunningService : Service() {
    private val notificationId = 9999
    private val channelId = "foreground_running_service_channel"
    private var taskTitle = "ScheduledTask 正在后台运行"
    private var taskDesc = "保持定时任务执行稳定性"
    
    // 存储任务列表: "taskId|time"
    private var nativeTaskList = ArrayList<String>()
    // 记录上一次检查任务的时间，避免在同一分钟内重复检查（虽然 TIME_TICK 是一分钟一次，但为了稳妥）
    private var lastCheckTime = ""

    private fun wakeUpScreenOnly() {
        try {
            Log.d("ForegroundService", "Attempting to wake up screen only")
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "ScheduledTask::WakeOnlyLockTag"
            )
            if (wakeLock.isHeld) wakeLock.release()
            wakeLock.acquire(10000L)
            Log.d("ForegroundService", "Screen woke up")
        } catch (e: Exception) {
            Log.e("ForegroundService", "Wake screen failed", e)
        }
    }

    private val systemBroadcastReceiver by lazy {
        object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                intent?.action?.let {
                    // 监听时间，系统级广播，每分钟触发一次。
                    if (it == Intent.ACTION_TIME_TICK) {
                        Log.d("ForegroundService", "Received ACTION_TIME_TICK")
                        checkNativeTasks()
                        emitEventToJS("onTick", null)
                    }
                }
            }
        }
    }

    private fun checkNativeTasks() {
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        val currentTime = sdf.format(Calendar.getInstance().time)
        
        if (currentTime == lastCheckTime) return
        lastCheckTime = currentTime

        Log.d("ForegroundService", "Checking native tasks for time: $currentTime")
        
        val matchedTasks = ArrayList<String>()
        for (taskStr in nativeTaskList) {
            val parts = taskStr.split("|")
            if (parts.size == 2) {
                val taskId = parts[0]
                val taskTime = parts[1]
                
                if (taskTime == currentTime) {
                    matchedTasks.add(taskId)
                }
            }
        }

        if (matchedTasks.isNotEmpty()) {
            Log.d("ForegroundService", "Native tasks triggered: ${matchedTasks.size} tasks at $currentTime")
            
            for (taskId in matchedTasks) {
                // 如果是唤醒任务，先执行原生唤醒
                if (taskId == "wakeup") {
                    wakeUpScreenOnly()
                    Log.d("ForegroundService", "Executed native wakeup logic")
                }

                // 所有任务都通过 Headless JS 执行，确保 JS 逻辑（如日志、后续指令）能运行且不拉起页面
                val serviceIntent = Intent(this, TaskHeadlessJsService::class.java).apply {
                    putExtra("taskId", taskId)
                }
                startService(serviceIntent)
                Log.d("ForegroundService", "Started Headless JS for task: $taskId")
            }
        }
    }

    private fun emitEventToJS(eventName: String, params: Any?) {
        val reactHost = (application as MainApplication).reactHost
        val reactContext = reactHost.currentReactContext
        if (reactContext != null) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } else {
            Log.w("ForegroundService", "ReactContext is null, cannot emit event: $eventName")
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("ForegroundService", "Service onCreate")
        
        createNotificationChannel()
        startForegroundWithNotification()

        // 注册系统时间广播
        val filter = IntentFilter(Intent.ACTION_TIME_TICK)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(systemBroadcastReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(systemBroadcastReceiver, filter)
        }
    }

    private fun startForegroundWithNotification() {
        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(taskTitle)
            .setContentText(taskDesc)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

        // 对于 Android 14+ (API 34)，必须在 startForeground 中声明类型
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(notificationId, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(notificationId, notification)
        }
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(taskTitle)
            .setContentText(taskDesc)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
        notificationManager.notify(notificationId, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "后台存活服务"
            val descriptionText = "用于保持应用在后台稳定运行"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(channelId, name, importance).apply {
                description = descriptionText
            }
            val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("ForegroundService", "onStartCommand, intent action: ${intent?.action}")
        intent?.let {
            if (it.hasKeyExtra("taskTitle")) {
                taskTitle = it.getStringExtra("taskTitle") ?: taskTitle
            }
            if (it.hasKeyExtra("taskDesc")) {
                taskDesc = it.getStringExtra("taskDesc") ?: taskDesc
            }
            
            if (it.action == "UPDATE_NOTIFICATION") {
                updateNotification()
            } else if (it.action == "SYNC_TASKS") {
                val list = it.getStringArrayListExtra("taskList")
                if (list != null) {
                    nativeTaskList = list
                    Log.d("ForegroundService", "Native tasks synced, count: ${nativeTaskList.size}")
                }
            } else {
                startForegroundWithNotification()
            }
        } ?: run {
            // 如果 intent 为空（系统重启服务），必须确保 startForeground 被调用
            Log.d("ForegroundService", "onStartCommand with null intent, restarting foreground")
            startForegroundWithNotification()
        }
        return START_STICKY
    }

    private fun Intent.hasKeyExtra(key: String): Boolean {
        return extras?.containsKey(key) ?: false
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(systemBroadcastReceiver)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
