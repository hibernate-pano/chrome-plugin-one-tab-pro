import { StorageService } from './storage';
import { ITabGroup, ITab } from '../types';

/**
 * 标签页管理器服务
 * 处理标签页的收集、恢复等操作
 */
export class TabManager {
  /**
   * 收集指定窗口的标签页并创建标签组
   * @param windowId 窗口ID，不指定则使用当前窗口
   * @param excludeCurrentTab 是否排除当前标签页
   * @returns 新创建的标签组
   */
  static async collectTabs(
    windowId?: number,
    excludeCurrentTab: boolean = false
  ): Promise<ITabGroup> {
    try {
      // 获取当前窗口信息
      if (!windowId) {
        const currentWindow = await chrome.windows.getCurrent();
        windowId = currentWindow.id;
      }

      // 查询窗口中的所有标签页
      const tabs = await chrome.tabs.query({ windowId });
      
      // 如果需要排除当前标签页，获取当前活跃标签页
      let currentTabId: number | undefined;
      if (excludeCurrentTab) {
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTabs.length > 0) {
          currentTabId = activeTabs[0].id;
        }
      }

      // 生成标签组ID
      const groupId = crypto.randomUUID();
      
      // 过滤和格式化标签页
      const filteredTabs: ITab[] = tabs
        .filter(tab => 
          // 排除扩展自身页面和可能的当前标签页
          tab.id !== undefined && 
          !tab.url?.startsWith('chrome-extension://') &&
          (!excludeCurrentTab || tab.id !== currentTabId))
        .map((tab, index) => ({
          id: crypto.randomUUID(),
          groupId: groupId,
          url: tab.url || '',
          title: tab.title || '无标题',
          favicon: tab.favIconUrl || '',
          position: index,
          addedAt: new Date().toISOString()
        }));

      // 如果没有可收集的标签页，抛出错误
      if (filteredTabs.length === 0) {
        throw new Error('没有可收集的标签页');
      }

      // 创建新的标签组
      const newGroup: ITabGroup = {
        id: groupId,
        name: `${new Date().toLocaleString('zh-CN')} - ${filteredTabs.length}个标签页`,
        tabs: filteredTabs,
        isLocked: false,
        isStarred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 将新标签组保存到存储中
      await StorageService.saveTabGroup(newGroup);

      // 关闭已收集的标签页
      const tabIdsToClose = tabs
        .filter(tab => 
          tab.id !== undefined && 
          !tab.url?.startsWith('chrome-extension://') &&
          (!excludeCurrentTab || tab.id !== currentTabId))
        .map(tab => tab.id as number);
      
      if (tabIdsToClose.length > 0) {
        await chrome.tabs.remove(tabIdsToClose);
      }

      return newGroup;
    } catch (error) {
      console.error('收集标签页失败:', error);
      throw new Error(`收集标签页失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 恢复单个标签页
   * @param tabId 标签页ID
   * @returns 是否成功恢复
   */
  static async restoreTab(tabId: string): Promise<boolean> {
    try {
      // 获取所有标签组
      const tabGroups = await StorageService.getTabGroups();
      
      // 遍历标签组查找指定的标签页
      for (const group of tabGroups) {
        const tabIndex = group.tabs.findIndex(tab => tab.id === tabId);
        
        if (tabIndex >= 0) {
          const tab = group.tabs[tabIndex];
          
          // 在新标签页中打开URL
          await chrome.tabs.create({ url: tab.url });
          
          // 从标签组中移除该标签页
          group.tabs.splice(tabIndex, 1);
          group.updatedAt = new Date().toISOString();
          
          // 如果标签组中没有标签页了，删除整个标签组
          if (group.tabs.length === 0) {
            await StorageService.deleteTabGroup(group.id);
          } else {
            // 否则更新标签组
            await StorageService.updateTabGroup(group.id, group);
          }
          
          return true;
        }
      }
      
      // 未找到指定的标签页
      return false;
    } catch (error) {
      console.error('恢复标签页失败:', error);
      throw new Error(`恢复标签页失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 恢复整个标签组
   * @param groupId 标签组ID
   * @returns 是否成功恢复
   */
  static async restoreGroup(groupId: string): Promise<boolean> {
    try {
      // 获取指定的标签组
      const tabGroups = await StorageService.getTabGroups();
      const group = tabGroups.find(g => g.id === groupId);
      
      if (!group) {
        return false;
      }
      
      // 恢复所有标签页
      for (const tab of group.tabs) {
        await chrome.tabs.create({ url: tab.url });
      }
      
      // 删除该标签组
      await StorageService.deleteTabGroup(groupId);
      
      return true;
    } catch (error) {
      console.error('恢复标签组失败:', error);
      throw new Error(`恢复标签组失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 