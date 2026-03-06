package com.scheduledtask

import android.content.Context
import android.os.PowerManager
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.Toast
import android.app.KeyguardManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log

class WakeScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WakeScreenModule"

    /**
     * 打开应用设置页面，引导用户开启“后台弹出界面”和“锁屏显示”权限
     */
    @ReactMethod
    fun openSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", reactApplicationContext.packageName, null)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e("WakeScreenModule", "Failed to open settings", e)
        }
    }

    /**
     * 核心亮屏方法：使用 WakeLock 强制点亮屏幕
     */
    @ReactMethod
    fun wakeUp(showActivity: Boolean = true) {
        Log.d("WakeScreenModule", "Attempting to wake screen (showActivity: $showActivity)...")
        val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        
        // 1. 使用 WakeLock 点亮屏幕
        @Suppress("DEPRECATION")
        val wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
            "ScheduledTask::WakeLockTag"
        )

        try {
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
            // 申请 WakeLock 点亮屏幕 10 秒
            wakeLock.acquire(10000L)
            Log.d("WakeScreenModule", "WakeLock acquired")

            // 2. 解锁键盘 (非安全锁)
            val keyguardManager = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            @Suppress("DEPRECATION")
            val keyguardLock = keyguardManager.newKeyguardLock("ScheduledTask::KeyguardLockTag")
            keyguardLock.disableKeyguard()

            // 3. 尝试拉起 MainActivity (配合 Window 标志效果更好)
            if (showActivity) {
                val intent = Intent(reactApplicationContext, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                }
                reactApplicationContext.startActivity(intent)
            }

            // 在主线程弹出反馈
            if (showActivity) {
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(reactApplicationContext, "正在尝试唤醒屏幕...", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            Log.e("WakeScreenModule", "WakeUp error", e)
        }
    }

    /**
     * 旧方法兼容
     */
    @ReactMethod
    fun wakeScreen() {
        wakeUp()
    }

    /**
     * 申请忽略电池优化，这对于 Android 14+ 的后台任务稳定性非常重要
     */
    @ReactMethod
    fun requestIgnoreBatteryOptimizations() {
        try {
            val packageName = reactApplicationContext.packageName
            val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            Log.e("WakeScreenModule", "Failed to request ignore battery optimizations", e)
        }
    }
}
