/**
 * 消息类型枚举
 */
export enum MessageType {
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
 * 消息响应接口
 */
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 消息服务 - 处理与后台脚本的通信
 */
export class MessageService {
  /**
   * 发送消息到后台脚本并等待响应
   * @param type 消息类型
   * @param data 消息数据
   * @returns 消息响应
   */
  static async sendMessage<T = any>(
    type: MessageType,
    data?: any
  ): Promise<MessageResponse<T>> {
    try {
      // 检查浏览器扩展API是否可用
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('浏览器扩展API不可用');
      }

      // 发送消息到后台脚本
      const response = await chrome.runtime.sendMessage({ type, data });

      // 验证响应
      if (!response) {
        throw new Error('没有收到响应');
      }

      return response as MessageResponse<T>;
    } catch (error) {
      console.error('发送消息失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送消息失败',
      };
    }
  }

  /**
   * 收集标签页
   * @param windowId 窗口ID，不指定则使用当前窗口
   * @param excludeCurrentTab 是否排除当前标签页
   */
  static async collectTabs(windowId?: number, excludeCurrentTab?: boolean) {
    return await this.sendMessage(MessageType.COLLECT_TABS, { windowId, excludeCurrentTab });
  }

  /**
   * 恢复单个标签页
   * @param tabId 标签页ID
   */
  static async restoreTab(tabId: string) {
    return await this.sendMessage(MessageType.RESTORE_TAB, { tabId });
  }

  /**
   * 恢复整个标签组
   * @param groupId 标签组ID
   */
  static async restoreGroup(groupId: string) {
    return await this.sendMessage(MessageType.RESTORE_GROUP, { groupId });
  }

  /**
   * 获取所有标签组
   */
  static async getTabGroups() {
    return await this.sendMessage(MessageType.GET_TAB_GROUPS);
  }

  /**
   * 删除标签组
   * @param groupId 标签组ID
   */
  static async deleteTabGroup(groupId: string) {
    return await this.sendMessage(MessageType.DELETE_TAB_GROUP, { groupId });
  }

  /**
   * 更新标签组
   * @param groupId 标签组ID
   * @param updates 更新内容
   */
  static async updateTabGroup(groupId: string, updates: any) {
    return await this.sendMessage(MessageType.UPDATE_TAB_GROUP, { groupId, updates });
  }

  /**
   * 获取设置
   */
  static async getSettings() {
    return await this.sendMessage(MessageType.GET_SETTINGS);
  }

  /**
   * 更新设置
   * @param updates 更新内容
   */
  static async updateSettings(updates: any) {
    return await this.sendMessage(MessageType.UPDATE_SETTINGS, { updates });
  }
} 