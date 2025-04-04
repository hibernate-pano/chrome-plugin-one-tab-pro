import { StorageService } from './storage';
import { User } from '../types/models';

/**
 * 认证服务 - 处理用户认证和登录状态
 */
export class AuthService {
  /**
   * 检查用户是否已登录
   */
  static async isLoggedIn(): Promise<boolean> {
    try {
      const { user } = await StorageService.getStorageData();
      return !!user;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 获取当前登录用户
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { user } = await StorageService.getStorageData();
      return user || null;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  /**
   * 保存用户登录信息
   */
  static async saveUserLogin(user: User): Promise<void> {
    try {
      await StorageService.setStorageData({
        user: {
          ...user,
          // 更新最后登录时间
          lastLoginAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('保存用户登录信息失败:', error);
      throw new Error('保存用户登录信息失败');
    }
  }

  /**
   * 退出登录
   */
  static async logout(): Promise<void> {
    try {
      await StorageService.setStorageData({ user: null });
    } catch (error) {
      console.error('退出登录失败:', error);
      throw new Error('退出登录失败');
    }
  }

  /**
   * 发起微信登录流程
   */
  static async initiateWechatLogin(): Promise<void> {
    try {
      // 创建微信登录页面
      const loginTab = await chrome.tabs.create({
        url: chrome.runtime.getURL('/login.html'),
        active: true
      });

      // 保存登录标签页ID，以便后续关闭
      await StorageService.setStorageData({
        loginTabId: loginTab.id
      });
    } catch (error) {
      console.error('发起微信登录失败:', error);
      throw new Error('发起微信登录失败');
    }
  }

  /**
   * 完成微信登录流程
   */
  static async completeWechatLogin(authCode: string): Promise<User> {
    try {
      // 这里应该调用实际的API服务来验证授权码并获取用户信息
      // 目前使用模拟数据
      const user: User = {
        id: crypto.randomUUID(),
        name: '微信用户',
        wechatId: authCode,
        avatar: 'https://placeholder.co/100'
      };

      // 保存用户信息
      await this.saveUserLogin(user);

      // 关闭登录标签页
      const { loginTabId } = await StorageService.getStorageData();
      if (loginTabId) {
        try {
          await chrome.tabs.remove(loginTabId);
        } catch (e) {
          console.warn('关闭登录标签页失败', e);
        }
      }

      return user;
    } catch (error) {
      console.error('完成微信登录失败:', error);
      throw new Error('完成微信登录失败');
    }
  }
} 