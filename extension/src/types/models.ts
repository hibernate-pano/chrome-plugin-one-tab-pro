/**
 * 标签页数据模型
 */
export interface Tab {
  id: string;        // 唯一标识符
  url: string;       // 标签页URL
  title: string;     // 标签页标题
  favicon?: string;  // 图标URL（可选）
  createdAt: number; // 创建时间戳
}

/**
 * 标签组数据模型
 */
export interface TabGroup {
  id: string;          // 唯一标识符
  name: string;        // 标签组名称
  tabs: Tab[];         // 标签页列表
  isLocked: boolean;   // 是否锁定（防止意外删除）
  createdAt: number;   // 创建时间戳
  updatedAt: number;   // 更新时间戳
}

/**
 * 用户数据模型
 */
export interface User {
  id: string;          // 唯一标识符
  name?: string;       // 用户名称（可选）
  wechatId?: string;   // 微信ID（可选）
  avatar?: string;     // 头像URL（可选）
}

/**
 * 应用设置
 */
export interface Settings {
  autoSyncEnabled: boolean;       // 是否启用自动同步
  autoSyncInterval: number;       // 自动同步间隔（分钟）
  openInNewTab: boolean;          // 恢复标签时是否在新标签页打开
  defaultGroupName: string;       // 默认标签组名称格式
  pinPopupWhenCollecting: boolean;// 收集标签时是否固定弹出窗口
}

/**
 * 同步状态
 */
export interface SyncStatus {
  lastSyncTime?: number;   // 上次同步时间
  status: 'success' | 'failed' | 'never' | 'in-progress'; // 同步状态
  errorMessage?: string;   // 错误信息（如果有）
}

/**
 * 离线操作类型
 */
export enum OfflineOperationType {
  CREATE_TAB_GROUP = 'CREATE_TAB_GROUP',
  UPDATE_TAB_GROUP = 'UPDATE_TAB_GROUP',
  DELETE_TAB_GROUP = 'DELETE_TAB_GROUP'
}

/**
 * 离线操作
 */
export interface OfflineOperation {
  id: string;               // 操作ID
  type: OfflineOperationType; // 操作类型
  data: any;                // 操作数据
  timestamp: number;        // 操作时间戳
}

/**
 * 存储在chrome.storage.local中的完整数据结构
 */
export interface StorageData {
  tabGroups?: TabGroup[];           // 标签组列表
  settings?: Settings;              // 用户设置
  user?: User | null;               // 当前用户（如果已登录）
  syncStatus?: SyncStatus;          // 同步状态
  offlineOperations?: OfflineOperation[]; // 离线操作队列
  lastSync?: number;                // 上次同步时间戳
} 