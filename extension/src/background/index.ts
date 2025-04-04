// 背景脚本 - 处理标签页操作和API调用

import { TabManager } from '../services/tabManager';
import { StorageService } from '../services/storage';

/**
 * 消息类型
 */
enum MessageType {
  COLLECT_TABS = 'COLLECT_TABS',
  RESTORE_TAB = 'RESTORE_TAB',
  RESTORE_GROUP = 'RESTORE_GROUP',
  GET_TAB_GROUPS = 'GET_TAB_GROUPS',
  DELETE_TAB_GROUP = 'DELETE_TAB_GROUP',
  UPDATE_TAB_GROUP = 'UPDATE_TAB_GROUP',
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
}

/**
 * 消息处理器
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 确保消息格式正确
  if (!message || !message.type) {
    sendResponse({ success: false, error: '无效的消息格式' });
    return true;
  }

  // 处理不同类型的消息
  handleMessage(message)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('消息处理错误:', error);
      sendResponse({ success: false, error: error.message || '处理消息时出错' });
    });

  // 返回true表示将异步发送响应
  return true;
});

/**
 * 处理不同类型的消息
 */
async function handleMessage(message: any): Promise<any> {
  const { type, data } = message;

  switch (type) {
    case MessageType.COLLECT_TABS:
      try {
        const { windowId, excludeCurrentTab } = data || {};
        const tabGroup = await TabManager.collectTabs(windowId, excludeCurrentTab);
        return { success: true, data: tabGroup };
      } catch (error) {
        throw new Error(`收集标签页失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.RESTORE_TAB:
      try {
        const { tabId } = data || {};
        if (!tabId) throw new Error('缺少标签页ID');

        const result = await TabManager.restoreTab(tabId);
        return { success: result, data: { restored: result } };
      } catch (error) {
        throw new Error(`恢复标签页失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.RESTORE_GROUP:
      try {
        const { groupId } = data || {};
        if (!groupId) throw new Error('缺少标签组ID');

        const result = await TabManager.restoreGroup(groupId);
        return { success: result, data: { restored: result } };
      } catch (error) {
        throw new Error(`恢复标签组失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.GET_TAB_GROUPS:
      try {
        const tabGroups = await StorageService.getTabGroups();
        return { success: true, data: tabGroups };
      } catch (error) {
        throw new Error(`获取标签组失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.DELETE_TAB_GROUP:
      try {
        const { groupId } = data || {};
        if (!groupId) throw new Error('缺少标签组ID');

        const result = await StorageService.deleteTabGroup(groupId);
        return { success: result, data: { deleted: result } };
      } catch (error) {
        throw new Error(`删除标签组失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.UPDATE_TAB_GROUP:
      try {
        const { groupId, updates } = data || {};
        if (!groupId) throw new Error('缺少标签组ID');
        if (!updates) throw new Error('缺少更新数据');

        const result = await StorageService.updateTabGroup(groupId, updates);
        return { success: !!result, data: result };
      } catch (error) {
        throw new Error(`更新标签组失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.GET_SETTINGS:
      try {
        const settings = await StorageService.getSettings();
        return { success: true, data: settings };
      } catch (error) {
        throw new Error(`获取设置失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    case MessageType.UPDATE_SETTINGS:
      try {
        const { updates } = data || {};
        if (!updates) throw new Error('缺少更新数据');

        const settings = await StorageService.updateSettings(updates);
        return { success: true, data: settings };
      } catch (error) {
        throw new Error(`更新设置失败: ${error instanceof Error ? error.message : String(error)}`);
      }

    default:
      throw new Error(`未知的消息类型: ${type}`);
  }
}

/**
 * 初始化后台服务
 */
async function initialize() {
  console.log('OneTabPro后台服务已启动');

  // 初始化设置，确保至少有默认设置
  try {
    await StorageService.getSettings();
  } catch (error) {
    console.error('初始化设置失败:', error);
  }

  // 注册右键菜单
  chrome.contextMenus.create({
    id: 'collect-current-window',
    title: '收集当前窗口的标签页',
    contexts: ['browser_action']
  });

  chrome.contextMenus.create({
    id: 'collect-all-windows',
    title: '收集所有窗口的标签页',
    contexts: ['browser_action']
  });
}

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'collect-current-window') {
    try {
      await TabManager.collectTabs(undefined, true);
    } catch (error) {
      console.error('收集当前窗口标签页失败:', error);
    }
  } else if (info.menuItemId === 'collect-all-windows') {
    try {
      // 获取所有窗口
      const windows = await chrome.windows.getAll({ populate: true });
      
      for (const window of windows) {
        if (window.id) {
          try {
            await TabManager.collectTabs(window.id, true);
          } catch (error) {
            console.error(`收集窗口 ${window.id} 的标签页失败:`, error);
          }
        }
      }
    } catch (error) {
      console.error('收集所有窗口标签页失败:', error);
    }
  }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await TabManager.collectTabs(tab.windowId, true);
  } catch (error) {
    console.error('点击图标收集标签页失败:', error);
  }
});

// 初始化
initialize();

// 当扩展安装或更新时初始化设置
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('扩展已安装');
    // 初始化存储
    chrome.storage.local.set({
      tabGroups: '[]',
      settings: JSON.stringify({
        autoCloseTabsAfterSaving: true,
        syncEnabled: true
      })
    });
  } else if (details.reason === 'update') {
    console.log('扩展已更新');
  }
});

// 导出只是为了避免TypeScript警告
export {}; 