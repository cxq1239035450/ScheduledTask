package com.scheduledtask

import android.content.Context
import android.content.Intent
import android.os.PowerManager
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class TaskHeadlessJsService : HeadlessJsTaskService() {
    private var wakeLock: PowerManager.WakeLock? = null

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras
        
        // 获取 WakeLock 保持 CPU 运行
        if (wakeLock == null) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ScheduledTask::HeadlessTaskLock")
            wakeLock?.acquire(120000L) // 锁定 120 秒（2分钟），确保复杂任务能执行完
        }

        return if (extras != null) {
            val taskId = extras.getString("taskId")
            HeadlessJsTaskConfig(
                "BackgroundTask", // 任务名称，需要在 JS 侧注册
                Arguments.fromBundle(extras),
                100000, // 超时时间增加到 100 秒，给足够时间处理应用切换和多步操作
                true // 允许在后台运行
            )
        } else {
            null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
        wakeLock = null
    }
}
