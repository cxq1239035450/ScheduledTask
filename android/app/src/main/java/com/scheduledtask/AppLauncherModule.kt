package com.scheduledtask

import android.content.Context
import android.content.Intent
import android.content.pm.LauncherApps
import android.os.Handler
import android.os.Looper
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
    fun launchApp(packageName: String, userIdSerialNumber: Double, promise: Promise) {
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
                    promise.resolve(true)
                } else {
                    showToast("无法在目标用户中找到应用: $packageName")
                    promise.resolve(false)
                }
            } else {
                showToast("未找到对应的分身/用户环境")
                promise.resolve(false)
            }
        } catch (e: Exception) {
            Log.e("AppLauncherModule", "Exception while launching app: $packageName", e)
            showToast("启动失败: ${e.message}")
            promise.reject("LAUNCH_APP_ERROR", e.message)
        }
    }

    /**
     * 关闭指定应用
     * @param packageName 要关闭的应用包名
     * @param userIdSerialNumber 目标用户的序列号（由 getInstalledApps 返回）
     * @return 是否成功关闭应用
     */
    @ReactMethod
    fun closeApp(packageName: String, userIdSerialNumber: Double, promise: Promise) {
        try {
            // 1. 模拟点击 Home 键回到桌面
            val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(homeIntent)

            // 2. 延迟 2 秒后回到本应用
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    val launchIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(reactApplicationContext.packageName)?.apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    }
                    if (launchIntent != null) {
                        reactApplicationContext.startActivity(launchIntent)
                    }
                    promise.resolve(true)
                } catch (e: Exception) {
                    Log.e("AppLauncherModule", "Failed to return to main activity", e)
                    promise.reject("CLOSE_APP_ERROR", "返回主界面失败: ${e.message}")
                }
            }, 2000)
            
            showToast("正在关闭应用...")
        } catch (e: Exception) {
            Log.e("AppLauncherModule", "Exception in closeApp", e)
            promise.reject("CLOSE_APP_ERROR", e.message)
        }
    }

    private fun showToast(message: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(reactApplicationContext, message, Toast.LENGTH_SHORT).show()
        }
    }
}