package com.scheduledtask

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class TaskHeadlessJsService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras
        return if (extras != null) {
            val taskId = extras.getString("taskId")
            HeadlessJsTaskConfig(
                "BackgroundTask", // 任务名称，需要在 JS 侧注册
                Arguments.fromBundle(extras),
                5000, // 超时时间
                true // 允许在后台运行
            )
        } else {
            null
        }
    }
}
