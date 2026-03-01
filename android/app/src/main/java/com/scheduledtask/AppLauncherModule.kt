package com.scheduledtask

import android.content.Context
import android.content.Intent
import android.content.pm.LauncherApps
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.os.UserManager
import android.util.Log
import android.widget.Toast
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray

class AppLauncherModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppLauncherModule"

    /**
     * 获取手机内所有用户/分身中已安装的应用列表
     */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val launcherApps = reactApplicationContext.getSystemService(Context.LAUNCHER_APPS_SERVICE) as LauncherApps
            val userManager = reactApplicationContext.getSystemService(Context.USER_SERVICE) as UserManager
            
            val appList: WritableArray = Arguments.createArray()
            
            // 遍历所有用户（包括主用户、工作资料/分身用户）
            for (user in userManager.userProfiles) {
                val activities = launcherApps.getActivityList(null, user)
                val userId = userManager.getSerialNumberForUser(user)
                
                for (activityInfo in activities) {
                    val appMap = Arguments.createMap()
                    val label = activityInfo.label.toString()
                    val packageName = activityInfo.applicationInfo.packageName
                    
                    appMap.putString("label", label)
                    appMap.putString("packageName", packageName)
                    appMap.putDouble("userId", userId.toDouble()) // 将 userId 传给 JS
                    
                    // 如果不是主用户（通常 serialNumber > 0），在标签后增加标识
                    if (userId > 0) {
                        appMap.putString("label", "$label (分身/多用户)")
                    }
                    
                    appList.pushMap(appMap)
                }
            }
            
            promise.resolve(appList)
        } catch (e: Exception) {
            promise.reject("GET_APPS_ERROR", e.message)
        }
    }

    /**
     * 根据包名和用户 ID 启动特定应用实例
     * @param packageName 目标应用的包名
     * @param userIdSerialNumber 目标用户的序列号（由 getInstalledApps 返回）
     */
    @ReactMethod
    fun launchApp(packageName: String, userIdSerialNumber: Double) {
        try {
            val launcherApps = reactApplicationContext.getSystemService(Context.LAUNCHER_APPS_SERVICE) as LauncherApps
            val userManager = reactApplicationContext.getSystemService(Context.USER_SERVICE) as UserManager
            
            val user = userManager.getUserForSerialNumber(userIdSerialNumber.toLong())
            
            if (user != null) {
                val activities = launcherApps.getActivityList(packageName, user)
                if (activities.isNotEmpty()) {
                    val component = activities[0].componentName
                    launcherApps.startMainActivity(component, user, null, null)
                    Log.d("AppLauncherModule", "Successfully launched: $packageName for user $userIdSerialNumber")
                } else {
                    showToast("无法在目标用户中找到应用: $packageName")
                }
            } else {
                showToast("未找到对应的分身/用户环境")
            }
        } catch (e: Exception) {
            Log.e("AppLauncherModule", "Exception while launching app: $packageName", e)
            showToast("启动失败: ${e.message}")
        }
    }

    private fun showToast(message: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(reactApplicationContext, message, Toast.LENGTH_SHORT).show()
        }
    }
}
