package com.scheduledtask

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
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

    override fun onDestroy() {
        super.onDestroy()
        Log.d("TouchSimulationService", "Service destroyed")
        instance = null
    }

    /**
     * 执行手势模拟
     */
    fun performGesture(startX: Int, startY: Int, endX: Int, endY: Int, duration: Long): Boolean {
        Log.d("TouchSimulationService", "Performing gesture: ($startX, $startY) -> ($endX, $endY)")
        
        val path = Path().apply {
            moveTo(startX.toFloat(), startY.toFloat())
            lineTo(endX.toFloat(), endY.toFloat())
        }

        val stroke = GestureDescription.StrokeDescription(path, 0, duration)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        return dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d("TouchSimulationService", "Gesture completed")
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.d("TouchSimulationService", "Gesture cancelled")
            }
        }, null)
    }

    companion object {
        private var instance: TouchSimulationService? = null

        fun getInstance(): TouchSimulationService? = instance

        fun isServiceRunning(): Boolean = instance != null
    }
}
