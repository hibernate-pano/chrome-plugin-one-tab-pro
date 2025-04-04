import { StorageService } from './storage';
import { OfflineOperation, OfflineOperationType, SyncStatus, TabGroup } from '../types/models';
import { AuthService } from './authService';
import { ApiService } from './apiService';

/**
 * 数据同步服务 - 处理本地和远程数据的同步
 */
export class SyncService {
  /**
   * 执行数据同步
   * 1. 检查用户是否已登录和在线
   * 2. 检查是否有离线操作需要同步
   * 3. 从API获取最新数据
   * 4. 解决冲突并合并数据
   * 5. 更新本地存储
   */
  static async syncData(): Promise<boolean> {
    try {
      // 更新同步状态
      await this.updateSyncStatus({ status: 'in-progress' });

      // 检查用户是否登录及网络状态
      const isLoggedIn = await AuthService.isLoggedIn();
      const isOnline = navigator.onLine;

      if (!isLoggedIn || !isOnline) {
        const reason = !isLoggedIn ? '用户未登录' : '网络离线';
        await this.updateSyncStatus({
          status: 'failed',
          errorMessage: reason
        });
        return false;
      }

      // 获取离线操作队列
      const { offlineOperations = [] } = await StorageService.getStorageData();
      
      // 获取本地标签组数据
      const localTabGroups = await StorageService.getTabGroups();
      
      // 执行离线操作同步
      if (offlineOperations.length > 0) {
        await this.syncOfflineOperations(offlineOperations);
      }
      
      // 从API获取远程数据
      const remoteTabGroups = await this.fetchRemoteTabGroups();
      
      // 合并本地和远程数据
      const mergedTabGroups = this.mergeTabGroups(localTabGroups, remoteTabGroups);
      
      // 更新本地存储
      await StorageService.setStorageData({
        tabGroups: mergedTabGroups,
        offlineOperations: [], // 清空已同步的离线操作
        lastSync: Date.now()
      });
      
      // 更新同步状态
      await this.updateSyncStatus({
        status: 'success',
        lastSyncTime: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('同步失败:', error);
      
      // 更新同步状态
      await this.updateSyncStatus({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '同步失败'
      });
      
      return false;
    }
  }

  /**
   * 将操作添加到离线队列
   */
  static async addOfflineOperation(
    type: OfflineOperationType,
    data: any
  ): Promise<void> {
    const { offlineOperations = [] } = await StorageService.getStorageData();
    
    const newOperation: OfflineOperation = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now()
    };
    
    offlineOperations.push(newOperation);
    
    await StorageService.setStorageData({ offlineOperations });
  }

  /**
   * 同步离线操作
   */
  private static async syncOfflineOperations(
    operations: OfflineOperation[]
  ): Promise<void> {
    // 按时间戳排序操作
    const sortedOperations = [...operations].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const operation of sortedOperations) {
      try {
        switch (operation.type) {
          case OfflineOperationType.CREATE_TAB_GROUP:
            await ApiService.createTabGroup(operation.data);
            break;
            
          case OfflineOperationType.UPDATE_TAB_GROUP:
            await ApiService.updateTabGroup(operation.data.id, operation.data);
            break;
            
          case OfflineOperationType.DELETE_TAB_GROUP:
            await ApiService.deleteTabGroup(operation.data.id);
            break;
        }
      } catch (error) {
        console.error(`同步操作 ${operation.id} 失败:`, error);
        // 继续处理其他操作，不要中断整个同步过程
      }
    }
  }

  /**
   * 从API获取远程标签组数据
   */
  private static async fetchRemoteTabGroups(): Promise<TabGroup[]> {
    try {
      return await ApiService.getTabGroups();
    } catch (error) {
      console.error('获取远程标签组失败:', error);
      throw error;
    }
  }

  /**
   * 合并本地和远程标签组数据
   * 使用基于时间戳的冲突解决策略
   */
  private static mergeTabGroups(
    localGroups: TabGroup[],
    remoteGroups: TabGroup[]
  ): TabGroup[] {
    const mergedGroups: TabGroup[] = [];
    const groupsMap = new Map<string, TabGroup>();
    
    // 先添加所有本地组
    for (const group of localGroups) {
      groupsMap.set(group.id, group);
    }
    
    // 合并远程组
    for (const remoteGroup of remoteGroups) {
      const localGroup = groupsMap.get(remoteGroup.id);
      
      if (!localGroup) {
        // 如果本地没有，则添加远程版本
        groupsMap.set(remoteGroup.id, remoteGroup);
      } else {
        // 如果都有，保留较新的版本
        if (remoteGroup.updatedAt > localGroup.updatedAt) {
          groupsMap.set(remoteGroup.id, remoteGroup);
        }
      }
    }
    
    // 将Map转换回数组
    return Array.from(groupsMap.values());
  }

  /**
   * 更新同步状态
   */
  private static async updateSyncStatus(
    updates: Partial<SyncStatus>
  ): Promise<void> {
    const { syncStatus = { status: 'never' } } = await StorageService.getStorageData();
    
    const newStatus: SyncStatus = {
      ...syncStatus,
      ...updates
    };
    
    await StorageService.setStorageData({ syncStatus: newStatus });
  }

  /**
   * 获取当前同步状态
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    const { syncStatus = { status: 'never' } } = await StorageService.getStorageData();
    return syncStatus;
  }

  /**
   * 检查是否需要自动同步
   */
  static async checkAutoSync(): Promise<boolean> {
    try {
      // 获取设置
      const settings = await StorageService.getSettings();
      
      // 如果没有启用自动同步，直接返回
      if (!settings.autoSyncEnabled) {
        return false;
      }
      
      // 获取上次同步时间
      const { lastSync = 0 } = await StorageService.getStorageData();
      
      // 计算距离上次同步的分钟数
      const minutesSinceLastSync = (Date.now() - lastSync) / (1000 * 60);
      
      // 如果超过同步间隔，执行同步
      if (minutesSinceLastSync >= settings.autoSyncInterval) {
        return await this.syncData();
      }
      
      return false;
    } catch (error) {
      console.error('检查自动同步失败:', error);
      return false;
    }
  }
} 