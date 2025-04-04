import { TabGroup, Tab, Settings, StorageData } from '../types/models';

// 默认设置
const DEFAULT_SETTINGS: Settings = {
  autoSyncEnabled: false,
  autoSyncInterval: 30, // 分钟
  openInNewTab: true,
  defaultGroupName: '在 %DATE% 保存的标签页', // %DATE% 将被替换为当前日期
  pinPopupWhenCollecting: false
};

/**
 * 存储服务 - 处理Chrome存储API的所有操作
 */
export class StorageService {
  /**
   * 保存标签组到本地存储
   */
  static async saveTabGroup(tabGroup: TabGroup): Promise<TabGroup> {
    // 确保ID存在
    if (!tabGroup.id) {
      tabGroup.id = crypto.randomUUID();
    }
    
    // 确保时间戳存在
    if (!tabGroup.createdAt) {
      tabGroup.createdAt = Date.now();
    }
    tabGroup.updatedAt = Date.now();

    // 获取当前存储的所有标签组
    const { tabGroups = [] } = await this.getStorageData();
    
    // 查找是否已存在该组
    const existingIndex = tabGroups.findIndex(group => group.id === tabGroup.id);
    
    if (existingIndex >= 0) {
      // 更新现有组
      tabGroups[existingIndex] = tabGroup;
    } else {
      // 添加新组
      tabGroups.push(tabGroup);
    }
    
    // 保存回存储
    await this.setStorageData({ tabGroups });
    
    return tabGroup;
  }

  /**
   * 获取所有标签组
   */
  static async getTabGroups(): Promise<TabGroup[]> {
    const { tabGroups = [] } = await this.getStorageData();
    return tabGroups;
  }

  /**
   * 通过ID获取标签组
   */
  static async getTabGroupById(id: string): Promise<TabGroup | undefined> {
    const tabGroups = await this.getTabGroups();
    return tabGroups.find(group => group.id === id);
  }

  /**
   * 删除标签组
   */
  static async deleteTabGroup(id: string): Promise<boolean> {
    const { tabGroups = [] } = await this.getStorageData();
    const newTabGroups = tabGroups.filter(group => group.id !== id);
    
    // 如果长度不变，说明没有找到要删除的组
    if (newTabGroups.length === tabGroups.length) {
      return false;
    }
    
    await this.setStorageData({ tabGroups: newTabGroups });
    return true;
  }

  /**
   * 更新标签组
   */
  static async updateTabGroup(id: string, updates: Partial<TabGroup>): Promise<TabGroup | undefined> {
    const tabGroups = await this.getTabGroups();
    const index = tabGroups.findIndex(group => group.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    // 创建更新后的标签组
    const updatedTabGroup = {
      ...tabGroups[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    tabGroups[index] = updatedTabGroup;
    await this.setStorageData({ tabGroups });
    
    return updatedTabGroup;
  }

  /**
   * 获取用户设置
   */
  static async getSettings(): Promise<Settings> {
    const { settings = DEFAULT_SETTINGS } = await this.getStorageData();
    return settings;
  }

  /**
   * 更新用户设置
   */
  static async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    
    await this.setStorageData({ settings: newSettings });
    return newSettings;
  }

  /**
   * 获取所有存储数据
   */
  static async getStorageData(): Promise<StorageData> {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        resolve(data as StorageData);
      });
    });
  }

  /**
   * 保存数据到存储
   */
  static async setStorageData(data: Partial<StorageData>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }

  /**
   * 清除存储中的所有数据
   */
  static async clearStorage(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageUsage(): Promise<{ used: number, available: number }> {
    return new Promise((resolve) => {
      // 获取已使用的存储空间
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        // Chrome存储API限制
        const storageLimit = 10485760; // 10MB
        resolve({
          used: bytesInUse,
          available: storageLimit - bytesInUse
        });
      });
    });
  }
} 