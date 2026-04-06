package com.scheduledtask

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class TouchSimulationService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // 不需要处理事件
    }

    override fun onInterrupt() {
        // 不需要处理中断
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d("TouchSimulationService", "Service connected")
        instance = this
    }

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        Log.d("TouchSimulationService", "Service unbinded")
        instance = null
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("TouchSimulationService", "Service destroyed")
        instance = null
    }

    /**
     * 手势执行回调接口
     */
    interface GestureCallback {
        fun onFinished(success: Boolean, message: String)
    }

    /**
     * 执行手势模拟
     */
    fun performGesture(startX: Int, startY: Int, endX: Int, endY: Int, duration: Long, callback: GestureCallback? = null): Boolean {
        Log.d("TouchSimulationService", "Preparing gesture: ($startX, $startY) -> ($endX, $endY)")
        
        val path = Path().apply {
            moveTo(startX.toFloat(), startY.toFloat())
            lineTo(endX.toFloat(), endY.toFloat())
        }

        val stroke = GestureDescription.StrokeDescription(path, 0, duration)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        // 确保在主线程执行 dispatchGesture，否则可能会导致服务崩溃或异常
        Handler(Looper.getMainLooper()).post {
            try {
                Log.d("TouchSimulationService", "Dispatching gesture on main thread")
                val dispatchResult = dispatchGesture(gesture, object : GestureResultCallback() {
                    override fun onCompleted(gestureDescription: GestureDescription?) {
                        super.onCompleted(gestureDescription)
                        Log.d("TouchSimulationService", "Gesture completed")
                        callback?.onFinished(true, "Completed")
                    }

                    override fun onCancelled(gestureDescription: GestureDescription?) {
                        super.onCancelled(gestureDescription)
                        Log.w("TouchSimulationService", "Gesture cancelled")
                        callback?.onFinished(false, "Cancelled")
                    }
                }, null)
                
                if (!dispatchResult) {
                    Log.e("TouchSimulationService", "Failed to dispatch gesture immediately")
                    callback?.onFinished(false, "Failed to dispatch")
                }
            } catch (e: Exception) {
                Log.e("TouchSimulationService", "Failed to dispatch gesture with exception", e)
                callback?.onFinished(false, "Exception: ${e.message}")
            }
        }
        
        return true
    }

    companion object {
        private var instance: TouchSimulationService? = null

        fun getInstance(): TouchSimulationService? = instance

        fun isServiceRunning(): Boolean = instance != null
    }
}
