package com.scheduledtask

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TouchSimulationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TouchSimulationModule"

    /**
     * 检查辅助功能是否已开启
     */
    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        promise.resolve(TouchSimulationService.isServiceRunning())
    }

    /**
     * 跳转到辅助功能设置页面
     */
    @ReactMethod
    fun openAccessibilitySettings() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            Log.e("TouchSimulationModule", "Failed to open accessibility settings", e)
        }
    }

    /**
     * 模拟上滑动作
     */
    @ReactMethod
    fun simulateSwipeUp(promise: Promise) {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = width / 2
            val startY = (height * 0.8).toInt()
            val endX = width / 2
            val endY = (height * 0.2).toInt()
            val duration = 300L

            service.performGesture(startX, startY, endX, endY, duration, object : TouchSimulationService.GestureCallback {
                override fun onFinished(success: Boolean, message: String) {
                    if (success) promise.resolve(true) else promise.reject("SWIPE_FAILED", message)
                }
            })
            return
        }

        // 备份方案
        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels
                val command = "input swipe ${width/2} ${(height*0.8).toInt()} ${width/2} ${(height*0.2).toInt()} 300"
                val result = Runtime.getRuntime().exec(command).waitFor()
                if (result == 0) promise.resolve(true) else promise.reject("SHELL_FAILED", "Exit code $result")
            } catch (e: Exception) {
                promise.reject("SHELL_ERROR", e.message)
            }
        }.start()
    }

    /**
     * 模拟下滑动作
     */
    @ReactMethod
    fun simulateSwipeDown(promise: Promise) {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = width / 2
            val startY = (height * 0.2).toInt()
            val endX = width / 2
            val endY = (height * 0.8).toInt()
            val duration = 300L

            service.performGesture(startX, startY, endX, endY, duration, object : TouchSimulationService.GestureCallback {
                override fun onFinished(success: Boolean, message: String) {
                    if (success) promise.resolve(true) else promise.reject("SWIPE_FAILED", message)
                }
            })
            return
        }

        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels
                val command = "input swipe ${width/2} ${(height*0.2).toInt()} ${width/2} ${(height*0.8).toInt()} 300"
                val result = Runtime.getRuntime().exec(command).waitFor()
                if (result == 0) promise.resolve(true) else promise.reject("SHELL_FAILED", "Exit code $result")
            } catch (e: Exception) {
                promise.reject("SHELL_ERROR", e.message)
            }
        }.start()
    }

    /**
     * 模拟左滑动作
     */
    @ReactMethod
    fun simulateSwipeLeft(promise: Promise) {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = (width * 0.8).toInt()
            val startY = height / 2
            val endX = (width * 0.2).toInt()
            val endY = height / 2
            val duration = 300L

            service.performGesture(startX, startY, endX, endY, duration, object : TouchSimulationService.GestureCallback {
                override fun onFinished(success: Boolean, message: String) {
                    if (success) promise.resolve(true) else promise.reject("SWIPE_FAILED", message)
                }
            })
            return
        }

        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels
                val command = "input swipe ${(width*0.8).toInt()} ${height/2} ${(width*0.2).toInt()} ${height/2} 300"
                val result = Runtime.getRuntime().exec(command).waitFor()
                if (result == 0) promise.resolve(true) else promise.reject("SHELL_FAILED", "Exit code $result")
            } catch (e: Exception) {
                promise.reject("SHELL_ERROR", e.message)
            }
        }.start()
    }

    /**
     * 模拟右滑动作
     */
    @ReactMethod
    fun simulateSwipeRight(promise: Promise) {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = (width * 0.2).toInt()
            val startY = height / 2
            val endX = (width * 0.8).toInt()
            val endY = height / 2
            val duration = 300L

            service.performGesture(startX, startY, endX, endY, duration, object : TouchSimulationService.GestureCallback {
                override fun onFinished(success: Boolean, message: String) {
                    if (success) promise.resolve(true) else promise.reject("SWIPE_FAILED", message)
                }
            })
            return
        }

        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels
                val command = "input swipe ${(width*0.2).toInt()} ${height/2} ${(width*0.8).toInt()} ${height/2} 300"
                val result = Runtime.getRuntime().exec(command).waitFor()
                if (result == 0) promise.resolve(true) else promise.reject("SHELL_FAILED", "Exit code $result")
            } catch (e: Exception) {
                promise.reject("SHELL_ERROR", e.message)
            }
        }.start()
    }

    /**
     * 模拟自定义滑动动作
     */
    @ReactMethod
    fun simulateSwipe(startX: Int, startY: Int, endX: Int, endY: Int, duration: Double, promise: Promise) {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            service.performGesture(startX, startY, endX, endY, duration.toLong(), object : TouchSimulationService.GestureCallback {
                override fun onFinished(success: Boolean, message: String) {
                    if (success) promise.resolve(true) else promise.reject("SWIPE_FAILED", message)
                }
            })
            return
        }

        Thread {
            try {
                val command = "input swipe $startX $startY $endX $endY ${duration.toLong()}"
                val result = Runtime.getRuntime().exec(command).waitFor()
                if (result == 0) promise.resolve(true) else promise.reject("SHELL_FAILED", "Exit code $result")
            } catch (e: Exception) {
                promise.reject("SHELL_ERROR", e.message)
            }
        }.start()
    }

    /**
     * 模拟点击动作
     */
    @ReactMethod
    fun simulateClick(x: Float, y: Float, duration: Double, promise: Promise) {
        val service = TouchSimulationService.getInstance()
        if (service != null) {
            service.performGesture(x.toInt(), y.toInt(), x.toInt(), y.toInt(), duration.toLong(), object : TouchSimulationService.GestureCallback {
                override fun onFinished(success: Boolean, message: String) {
                    if (success) promise.resolve(true) else promise.reject("CLICK_FAILED", message)
                }
            })
            return
        }

        Thread {
            try {
                val command = "input tap ${x.toInt()} ${y.toInt()}"
                val result = Runtime.getRuntime().exec(command).waitFor()
                if (result == 0) promise.resolve(true) else promise.reject("SHELL_FAILED", "Exit code $result")
            } catch (e: Exception) {
                promise.reject("SHELL_ERROR", e.message)
            }
        }.start()
    }

    /**
     * 检查并请求忽略电池优化
     */
    @ReactMethod
    fun requestIgnoreBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val packageName = reactApplicationContext.packageName
            val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                try {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactApplicationContext.startActivity(intent)
                } catch (e: Exception) {
                    // 某些设备可能不支持直接跳转，尝试跳转到电池优化列表
                    try {
                        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        reactApplicationContext.startActivity(intent)
                    } catch (e2: Exception) {
                        Log.e("TouchSimulationModule", "Failed to open battery settings", e2)
                    }
                }
            }
        }
    }

    private fun showToast(message: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(reactApplicationContext, message, Toast.LENGTH_SHORT).show()
        }
    }
}