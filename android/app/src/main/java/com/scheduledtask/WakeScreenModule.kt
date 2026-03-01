package com.scheduledtask

import android.content.Context
import android.os.PowerManager
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.Toast
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
    fun wakeScreen() {
        val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        
        @Suppress("DEPRECATION")
        val wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "ScheduledTask::WakeLockTag"
        )

        try {
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
            // 申请 WakeLock 点亮屏幕 5 秒
            wakeLock.acquire(5000L)
            Log.d("WakeScreenModule", "WakeLock acquired")

            // 在主线程弹出反馈，确保息屏状态下指令执行可见
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(reactApplicationContext, "亮屏指令已发送", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e("WakeScreenModule", "WakeLock error", e)
        }
    }
}
