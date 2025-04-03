// 用户接口
export interface IUser {
  id: string;
  nickname: string;
  avatarUrl: string;
  wechatOpenId: string;
  wechatUnionId?: string;
  createdAt: string;
  lastLoginAt: string;
}

// 标签页组接口
export interface ITabGroup {
  id: string;
  userId?: string;
  name: string;
  isLocked: boolean;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  tabs: ITab[];
}

// 标签页接口
export interface ITab {
  id: string;
  groupId: string;
  url: string;
  title: string;
  favicon: string;
  position: number;
  addedAt: string;
}

// 应用设置接口
export interface ISettings {
  autoCloseTabsAfterSaving: boolean;
  syncEnabled: boolean;
  showFavicons: boolean;
  darkMode: boolean;
}

// API响应接口
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 认证状态接口
export interface IAuthState {
  isLoggedIn: boolean;
  token?: string;
  user?: IUser;
}

// 消息接口
export interface IMessage {
  action: string;
  [key: string]: any;
} 