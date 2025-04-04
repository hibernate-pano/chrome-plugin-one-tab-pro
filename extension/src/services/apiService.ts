import { TabGroup, User } from '../types/models';
import { StorageService } from './storage';

/**
 * API服务 - 处理与后端API的通信
 */
export class ApiService {
  // API基础URL，应该从环境或设置中读取
  private static API_BASE_URL = 'https://api.onetabpro.com/v1';

  /**
   * 获取API请求头
   */
  private static async getHeaders(): Promise<HeadersInit> {
    const { user } = await StorageService.getStorageData();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // 如果用户已登录，添加认证头
    if (user && user.id) {
      headers['Authorization'] = `Bearer ${user.id}`;
    }
    
    return headers;
  }

  /**
   * 发送API请求
   */
  private static async fetchAPI<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any
  ): Promise<T> {
    try {
      const url = `${this.API_BASE_URL}${endpoint}`;
      const headers = await this.getHeaders();
      
      const options: RequestInit = {
        method,
        headers,
        credentials: 'include'
      };
      
      // 如果有数据，添加到请求体
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errorData.error || `API错误: ${response.status}`);
      }
      
      // 解析响应数据
      const responseData = await response.json();
      return responseData.data as T;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  /**
   * 模拟API请求（开发阶段使用）
   */
  private static simulateAPIRequest<T>(
    endpoint: string,
    method: string = 'GET',
    data?: any,
    simulatedData?: T
  ): Promise<T> {
    console.log(`模拟API请求: ${method} ${endpoint}`, data);
    
    return new Promise((resolve) => {
      // 模拟网络延迟
      setTimeout(() => {
        resolve(simulatedData as T);
      }, 500);
    });
  }

  /**
   * 获取用户的所有标签组
   */
  static async getTabGroups(): Promise<TabGroup[]> {
    // 在线API集成前使用模拟数据
    return this.simulateAPIRequest<TabGroup[]>(
      '/tabgroups',
      'GET',
      undefined,
      []
    );
    
    // 实际API实现
    // return this.fetchAPI<TabGroup[]>('/tabgroups');
  }

  /**
   * 创建新标签组
   */
  static async createTabGroup(tabGroup: TabGroup): Promise<TabGroup> {
    // 在线API集成前使用模拟数据
    return this.simulateAPIRequest<TabGroup>(
      '/tabgroups',
      'POST',
      tabGroup,
      tabGroup
    );
    
    // 实际API实现
    // return this.fetchAPI<TabGroup>('/tabgroups', 'POST', tabGroup);
  }

  /**
   * 更新标签组
   */
  static async updateTabGroup(id: string, updates: Partial<TabGroup>): Promise<TabGroup> {
    // 在线API集成前使用模拟数据
    return this.simulateAPIRequest<TabGroup>(
      `/tabgroups/${id}`,
      'PUT',
      updates,
      { id, ...updates } as TabGroup
    );
    
    // 实际API实现
    // return this.fetchAPI<TabGroup>(`/tabgroups/${id}`, 'PUT', updates);
  }

  /**
   * 删除标签组
   */
  static async deleteTabGroup(id: string): Promise<boolean> {
    // 在线API集成前使用模拟数据
    return this.simulateAPIRequest<boolean>(
      `/tabgroups/${id}`,
      'DELETE',
      undefined,
      true
    );
    
    // 实际API实现
    // return this.fetchAPI<boolean>(`/tabgroups/${id}`, 'DELETE');
  }

  /**
   * 微信登录
   */
  static async wechatLogin(code: string): Promise<User> {
    // 在线API集成前使用模拟数据
    return this.simulateAPIRequest<User>(
      '/auth/wechat',
      'POST',
      { code },
      {
        id: crypto.randomUUID(),
        name: '微信用户',
        wechatId: code,
        avatar: 'https://placeholder.co/100'
      }
    );
    
    // 实际API实现
    // return this.fetchAPI<User>('/auth/wechat', 'POST', { code });
  }

  /**
   * 获取微信登录二维码URL
   */
  static async getWechatQrCodeUrl(): Promise<string> {
    // 在线API集成前使用模拟数据
    return this.simulateAPIRequest<string>(
      '/auth/wechat/qrcode',
      'GET',
      undefined,
      'https://placeholder.co/300x300?text=微信登录二维码'
    );
    
    // 实际API实现
    // return this.fetchAPI<string>('/auth/wechat/qrcode');
  }
} 