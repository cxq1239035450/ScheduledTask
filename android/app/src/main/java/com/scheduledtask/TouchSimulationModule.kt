package com.scheduledtask

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TouchSimulationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TouchSimulationModule"

    /**
     * 检查辅助功能是否已开启
     */
    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: com.facebook.react.bridge.Promise) {
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
    fun simulateSwipeUp() {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            // 方式 A：使用辅助功能模拟（推荐，无 Root 要求）
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = width / 2
            val startY = (height * 0.8).toInt()
            val endX = width / 2
            val endY = (height * 0.2).toInt()
            val duration = 300L

            val success = service.performGesture(startX, startY, endX, endY, duration)
            if (success) {
                showToast("辅助功能模拟上滑中...")
                return
            }
        }

        // 方式 B：使用 Shell 命令模拟（备份方案，通常需要 Root）
        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels

                val startX = width / 2
                val startY = (height * 0.8).toInt()
                val endX = width / 2
                val endY = (height * 0.2).toInt()
                val duration = 300

                val command = "input swipe $startX $startY $endX $endY $duration"
                val process = Runtime.getRuntime().exec(command)
                val result = process.waitFor()

                if (result == 0) {
                    showToast("Root/Shell 上滑已模拟")
                } else {
                    showToast("模拟上滑失败：请开启辅助功能")
                    Log.w("TouchSimulationModule", "Shell swipe failed, and service is not running")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationModule", "Failed to simulate swipe", e)
            }
        }.start()
    }

    /**
     * 模拟下滑动作
     */
    @ReactMethod
    fun simulateSwipeDown() {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            // 方式 A：使用辅助功能模拟（推荐，无 Root 要求）
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = width / 2
            val startY = (height * 0.2).toInt()
            val endX = width / 2
            val endY = (height * 0.8).toInt()
            val duration = 300L

            val success = service.performGesture(startX, startY, endX, endY, duration)
            if (success) {
                showToast("辅助功能模拟下滑中...")
                return
            }
        }

        // 方式 B：使用 Shell 命令模拟（备份方案，通常需要 Root）
        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels

                val startX = width / 2
                val startY = (height * 0.2).toInt()
                val endX = width / 2
                val endY = (height * 0.8).toInt()
                val duration = 300

                val command = "input swipe $startX $startY $endX $endY $duration"
                val process = Runtime.getRuntime().exec(command)
                val result = process.waitFor()

                if (result == 0) {
                    showToast("Root/Shell 下滑已模拟")
                } else {
                    showToast("模拟下滑失败：请开启辅助功能")
                    Log.w("TouchSimulationModule", "Shell swipe failed, and service is not running")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationModule", "Failed to simulate swipe", e)
            }
        }.start()
    }

    /**
     * 模拟左滑动作
     */
    @ReactMethod
    fun simulateSwipeLeft() {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            // 方式 A：使用辅助功能模拟（推荐，无 Root 要求）
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = (width * 0.8).toInt()
            val startY = height / 2
            val endX = (width * 0.2).toInt()
            val endY = height / 2
            val duration = 300L

            val success = service.performGesture(startX, startY, endX, endY, duration)
            if (success) {
                showToast("辅助功能模拟左滑中...")
                return
            }
        }

        // 方式 B：使用 Shell 命令模拟（备份方案，通常需要 Root）
        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels

                val startX = (width * 0.8).toInt()
                val startY = height / 2
                val endX = (width * 0.2).toInt()
                val endY = height / 2
                val duration = 300

                val command = "input swipe $startX $startY $endX $endY $duration"
                val process = Runtime.getRuntime().exec(command)
                val result = process.waitFor()

                if (result == 0) {
                    showToast("Root/Shell 左滑已模拟")
                } else {
                    showToast("模拟左滑失败：请开启辅助功能")
                    Log.w("TouchSimulationModule", "Shell swipe failed, and service is not running")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationModule", "Failed to simulate swipe", e)
            }
        }.start()
    }

    /**
     * 模拟右滑动作
     */
    @ReactMethod
    fun simulateSwipeRight() {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            // 方式 A：使用辅助功能模拟（推荐，无 Root 要求）
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels

            val startX = (width * 0.2).toInt()
            val startY = height / 2
            val endX = (width * 0.8).toInt()
            val endY = height / 2
            val duration = 300L

            val success = service.performGesture(startX, startY, endX, endY, duration)
            if (success) {
                showToast("辅助功能模拟右滑中...")
                return
            }
        }

        // 方式 B：使用 Shell 命令模拟（备份方案，通常需要 Root）
        Thread {
            try {
                val displayMetrics = reactApplicationContext.resources.displayMetrics
                val width = displayMetrics.widthPixels
                val height = displayMetrics.heightPixels

                val startX = (width * 0.2).toInt()
                val startY = height / 2
                val endX = (width * 0.8).toInt()
                val endY = height / 2
                val duration = 300

                val command = "input swipe $startX $startY $endX $endY $duration"
                val process = Runtime.getRuntime().exec(command)
                val result = process.waitFor()

                if (result == 0) {
                    showToast("Root/Shell 右滑已模拟")
                } else {
                    showToast("模拟右滑失败：请开启辅助功能")
                    Log.w("TouchSimulationModule", "Shell swipe failed, and service is not running")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationModule", "Failed to simulate swipe", e)
            }
        }.start()
    }

    /**
     * 模拟自定义滑动动作
     */
    @ReactMethod
    fun simulateSwipe(startX: Int, startY: Int, endX: Int, endY: Int, duration: Double) {
        val service = TouchSimulationService.getInstance()
        
        if (service != null) {
            val success = service.performGesture(startX, startY, endX, endY, duration.toLong())
            if (success) {
                showToast("辅助功能模拟滑动中...")
                return
            }
        }

        // 方式 B：使用 Shell 命令模拟（备份方案，通常需要 Root）
        Thread {
            try {
                val command = "input swipe $startX $startY $endX $endY ${duration.toLong()}"
                val process = Runtime.getRuntime().exec(command)
                val result = process.waitFor()

                if (result == 0) {
                    showToast("Root/Shell 滑动已模拟")
                } else {
                    showToast("模拟滑动失败：请开启辅助功能")
                    Log.w("TouchSimulationModule", "Shell swipe failed, and service is not running")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationModule", "Failed to simulate swipe", e)
            }
        }.start()
    }

    /**
     * 模拟点击动作
     */
    @ReactMethod
    fun simulateClick(x: Float, y: Float) {
        val service = TouchSimulationService.getInstance()
        if (service != null) {
            val success = service.performGesture(x.toInt(), y.toInt(), x.toInt(), y.toInt(), 50L)
            if (success) {
                showToast("辅助功能模拟点击中...")
                return
            }
        }

        Thread {
            try {
                val command = "input tap ${x.toInt()} ${y.toInt()}"
                val process = Runtime.getRuntime().exec(command)
                val result = process.waitFor()

                if (result == 0) {
                    showToast("Root/Shell 点击已模拟")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationModule", "Failed to simulate tap", e)
            }
        }.start()
    }

    private fun showToast(message: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(reactApplicationContext, message, Toast.LENGTH_SHORT).show()
        }
    }
}