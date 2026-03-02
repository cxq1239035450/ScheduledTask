import { Platform, PermissionsAndroid } from 'react-native';
import AppLauncherModule from '../modules/NativeModules/AppLauncherModule';

interface AppInfo {
  label: string;
  packageName: string;
  userId: number;
  isSystemApp?: boolean;
  isInstalled?: boolean;
}

class AppManager {
  private static instance: AppManager;
  private appCache: Map<string, AppInfo[]> = new Map();
  private lastUpdateTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {}

  public static getInstance(): AppManager {
    if (!AppManager.instance) {
      AppManager.instance = new AppManager();
    }
    return AppManager.instance;
  }

  /**
   * 获取所有已安装的应用
   */
  public async getAllInstalledApps(): Promise<AppInfo[]> {
    const now = Date.now();
    const cacheKey = 'all_apps';

    // 检查缓存
    if (this.appCache.has(cacheKey) && (now - this.lastUpdateTime) < this.CACHE_DURATION) {
      return this.appCache.get(cacheKey)!;
    }

    try {
      const apps = await AppLauncherModule.getInstalledApps();
      const appList: AppInfo[] = apps.map((app: any) => ({
        label: app.label,
        packageName: app.packageName,
        userId: app.userId,
        isInstalled: true
      }));

      // 更新缓存
      this.appCache.set(cacheKey, appList);
      this.lastUpdateTime = now;

      return appList;
    } catch (error) {
      console.error('获取应用列表失败:', error);
      return [];
    }
  }

  /**
   * 根据包名检查应用是否已安装
   */
  public async isAppInstalled(packageName: string): Promise<boolean> {
    try {
      const apps = await this.getAllInstalledApps();
      return apps.some(app => app.packageName === packageName);
    } catch (error) {
      console.error('检查应用安装状态失败:', error);
      return false;
    }
  }

  /**
   * 根据关键词搜索应用
   */
  public async searchApps(keyword: string): Promise<AppInfo[]> {
    try {
      const apps = await this.getAllInstalledApps();
      const lowerKeyword = keyword.toLowerCase();
      
      return apps.filter(app => 
        app.label.toLowerCase().includes(lowerKeyword) || 
        app.packageName.toLowerCase().includes(lowerKeyword)
      );
    } catch (error) {
      console.error('搜索应用失败:', error);
      return [];
    }
  }

  /**
   * 获取常用应用列表
   */
  public async getCommonApps(): Promise<AppInfo[]> {
    const commonPackages = [
      'com.tencent.mm', // 微信
      'com.tencent.mobileqq', // QQ
      'com.eg.android.AlipayGphone', // 支付宝
      'com.taobao.taobao', // 淘宝
      'com.jingdong.app.mall', // 京东
      'com.ss.android.ugc.aweme', // 抖音
      'com.smile.gifmaker', // 快手
      'com.tencent.wework', // 企业微信
      'com.alibaba.android.rimet', // 钉钉
      'com.autonavi.minimap', // 高德地图
      'com.baidu.BaiduMap', // 百度地图
      'com.tencent.mm', // 微信
    ];

    try {
      const apps = await this.getAllInstalledApps();
      return apps.filter(app => commonPackages.includes(app.packageName));
    } catch (error) {
      console.error('获取常用应用失败:', error);
      return [];
    }
  }

  /**
   * 启动应用
   */
  public async launchApp(packageName: string, userId: number = 0): Promise<boolean> {
    try {
      const isInstalled = await this.isAppInstalled(packageName);
      if (!isInstalled) {
        console.warn(`应用 ${packageName} 未安装`);
        return false;
      }

      AppLauncherModule.launchApp(packageName, userId);
      return true;
    } catch (error) {
      console.error('启动应用失败:', error);
      return false;
    }
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.appCache.clear();
    this.lastUpdateTime = 0;
  }

  /**
   * 获取应用分类
   */
  public async getCategorizedApps(): Promise<{ [category: string]: AppInfo[] }> {
    try {
      const apps = await this.getAllInstalledApps();
      const categories: { [category: string]: AppInfo[] } = {
        '社交': [],
        '支付': [],
        '购物': [],
        '娱乐': [],
        '办公': [],
        '工具': [],
        '其他': []
      };

      const socialApps = ['com.tencent.mm', 'com.tencent.mobileqq', 'com.tencent.wework', 'com.alibaba.android.rimet'];
      const paymentApps = ['com.eg.android.AlipayGphone', 'com.tencent.mm'];
      const shoppingApps = ['com.taobao.taobao', 'com.jingdong.app.mall', 'com.tmall.wireless'];
      const entertainmentApps = ['com.ss.android.ugc.aweme', 'com.smile.gifmaker', 'com.tencent.qqlive'];
      const officeApps = ['com.alibaba.android.rimet', 'com.tencent.wework', 'cn.wps.moffice_eng'];
      const toolApps = ['com.autonavi.minimap', 'com.baidu.BaiduMap', 'com.cleanmaster.mguard'];

      apps.forEach(app => {
        if (socialApps.includes(app.packageName)) {
          categories['社交'].push(app);
        } else if (paymentApps.includes(app.packageName)) {
          categories['支付'].push(app);
        } else if (shoppingApps.includes(app.packageName)) {
          categories['购物'].push(app);
        } else if (entertainmentApps.includes(app.packageName)) {
          categories['娱乐'].push(app);
        } else if (officeApps.includes(app.packageName)) {
          categories['办公'].push(app);
        } else if (toolApps.includes(app.packageName)) {
          categories['工具'].push(app);
        } else {
          categories['其他'].push(app);
        }
      });

      return categories;
    } catch (error) {
      console.error('获取应用分类失败:', error);
      return {};
    }
  }
}

export default AppManager.getInstance();