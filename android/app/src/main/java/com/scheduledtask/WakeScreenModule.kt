package com.scheduledtask

import android.content.Context
import android.os.PowerManager
import android.os.Build
import android.app.KeyguardManager
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log

class WakeScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WakeScreenModule"
    }

    @ReactMethod
    fun openSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
        val uri = Uri.fromParts("package", reactApplicationContext.packageName, null)
        intent.data = uri
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun wakeScreen() {
        val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
        
        Log.d("WakeScreenModule", "wakeScreen called")
        
        // 1. 尝试将 Activity 唤醒到前台（这对于很多设备是亮屏的前提）
        try {
            val intent = Intent(reactApplicationContext, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e("WakeScreenModule", "Failed to start activity", e)
        }

        // 2. 使用 WakeLock 尝试亮屏
        @Suppress("DEPRECATION")
        val wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK or
            PowerManager.ACQUIRE_CAUSES_WAKEUP or
            PowerManager.ON_AFTER_RELEASE,
            "ScheduledTask::WakeScreen"
        )
        
        try {
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
            wakeLock.acquire(10000L) // 保持亮屏10秒
            Log.d("WakeScreenModule", "WakeLock acquired")
        } catch (e: Exception) {
            Log.e("WakeScreenModule", "Failed to acquire wake lock", e)
        }

        // 3. 设置 Activity 窗口标志
        reactApplicationContext.currentActivity?.let { activity ->
            activity.runOnUiThread {
                try {
                    Log.d("WakeScreenModule", "Setting activity flags...")
                    
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                        activity.setShowWhenLocked(true)
                        activity.setTurnScreenOn(true)
                        val keyguardManager = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                        keyguardManager.requestDismissKeyguard(activity, null)
                    } 
                    
                    activity.window.addFlags(
                        android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                        android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                        android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                        android.view.WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
                    )
                    
                    Toast.makeText(reactApplicationContext, "亮屏指令已执行 (包含强制前台)", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Log.e("WakeScreenModule", "Failed to set activity flags", e)
                }
            }
        }
    }
}