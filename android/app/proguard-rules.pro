# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.bridge.CatalystInstanceImpl { *; }
-keep class com.facebook.react.bridge.WritableNativeMap { *; }
-keep class com.facebook.react.bridge.WritableNativeArray { *; }
-keep class com.facebook.react.bridge.ReadableNativeMap { *; }
-keep class com.facebook.react.bridge.ReadableNativeArray { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.JavaScriptModule { *; }
-keep class com.facebook.react.bridge.BaseJavaModule { *; }
-keep class com.facebook.react.uimanager.annotations.ReactProp { *; }
-keep class com.facebook.react.uimanager.annotations.ReactPropGroup { *; }

# For the new architecture
-keep class com.facebook.react.turbomodule.core.TurboModuleManager { *; }
-keep class com.facebook.react.fabric.FabricUIManager { *; }

# Keep native modules
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule {
  public <methods>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep GSON/JSON related if used (React Native uses it internally)
-keepattributes Signature
-keepattributes *Annotation*
-keep class sun.misc.Unsafe { *; }
-keep class com.google.gson.stream.** { *; }

# OkHttp
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Okio
-keep class okio.** { *; }
-dontwarn okio.**
