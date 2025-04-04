import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/models';
import { StorageService } from '../services/storage';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isOnline: boolean;
  loading: boolean;
  error: string | null;
  actions: {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    checkLoginStatus: () => Promise<boolean>;
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化时检查登录状态
  useEffect(() => {
    checkLoginStatus();

    // 监听存储变化
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.user) {
        setUser(changes.user.newValue);
        setIsLoggedIn(!!changes.user.newValue);
      }
    };

    // 监听在线状态变化
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // 检查登录状态
  const checkLoginStatus = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await StorageService.getStorageData();
      const savedUser = data.user || null;
      
      setUser(savedUser);
      setIsLoggedIn(!!savedUser);
      
      return !!savedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查登录状态失败';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // 此处暂时使用模拟登录，后续集成微信登录
      const mockUser: User = {
        id: 'temp-user-id',
        name: '测试用户',
      };
      
      await StorageService.setStorageData({ user: mockUser });
      setUser(mockUser);
      setIsLoggedIn(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await StorageService.setStorageData({ user: null });
      setUser(null);
      setIsLoggedIn(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登出失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoggedIn,
    isOnline,
    loading,
    error,
    actions: {
      login,
      logout,
      checkLoginStatus
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook，便于在组件中使用AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext必须在AuthProvider内部使用');
  }
  
  return context;
}; 