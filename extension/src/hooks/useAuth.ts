import { useState, useEffect, useCallback } from 'react';
import { IAuthState, IUser } from '../types';
import { authApi } from '../services/api';

export const useAuth = () => {
  const [authState, setAuthState] = useState<IAuthState>({
    isLoggedIn: false,
    token: undefined,
    user: undefined
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化认证状态
  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 检查Chrome存储中是否有令牌
      const { authToken } = await chrome.storage.local.get(['authToken']);
      
      if (!authToken) {
        setAuthState({ isLoggedIn: false });
        setLoading(false);
        return;
      }
      
      // 验证令牌有效性
      const authState = await authApi.validateToken();
      setAuthState(authState);
    } catch (err) {
      setError('初始化认证状态时出错');
      setAuthState({ isLoggedIn: false });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时加载认证状态
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 处理登录
  const login = useCallback(async (code: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.completeLogin(code);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // 存储令牌到Chrome存储
        await chrome.storage.local.set({ authToken: token });
        
        // 更新认证状态
        setAuthState({
          isLoggedIn: true,
          token,
          user
        });
        
        return true;
      } else {
        setError(response.error?.message || '登录失败');
        return false;
      }
    } catch (err) {
      setError('登录过程中出错');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理登出
  const logout = useCallback(async (): Promise<void> => {
    try {
      // 从Chrome存储中删除令牌
      await chrome.storage.local.remove(['authToken']);
      
      // 更新认证状态
      setAuthState({ isLoggedIn: false });
    } catch (err) {
      setError('登出过程中出错');
    }
  }, []);

  // 更新用户信息
  const updateUser = useCallback((user: IUser) => {
    setAuthState(prev => ({
      ...prev,
      user
    }));
  }, []);

  return {
    authState,
    loading,
    error,
    login,
    logout,
    updateUser,
    initAuth
  };
}; 