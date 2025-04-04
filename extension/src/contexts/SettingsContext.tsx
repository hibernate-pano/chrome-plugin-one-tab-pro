import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings } from '../types/models';
import { StorageService } from '../services/storage';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  error: string | null;
  actions: {
    updateSettings: (updates: Partial<Settings>) => Promise<Settings>;
    resetSettings: () => Promise<Settings>;
  };
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    autoSyncEnabled: false,
    autoSyncInterval: 30,
    openInNewTab: true,
    defaultGroupName: '在 %DATE% 保存的标签页',
    pinPopupWhenCollecting: false
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化时加载设置
  useEffect(() => {
    loadSettings();

    // 监听存储变化
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.settings) {
        setSettings(changes.settings.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 加载设置
  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新设置
  const updateSettings = async (updates: Partial<Settings>): Promise<Settings> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedSettings = await StorageService.updateSettings(updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新设置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 重置为默认设置
  const resetSettings = async (): Promise<Settings> => {
    setLoading(true);
    setError(null);
    
    try {
      const defaultSettings: Settings = {
        autoSyncEnabled: false,
        autoSyncInterval: 30,
        openInNewTab: true,
        defaultGroupName: '在 %DATE% 保存的标签页',
        pinPopupWhenCollecting: false
      };
      
      const updatedSettings = await StorageService.updateSettings(defaultSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置设置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: SettingsContextValue = {
    settings,
    loading,
    error,
    actions: {
      updateSettings,
      resetSettings
    }
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// 自定义Hook，便于在组件中使用SettingsContext
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  
  if (context === undefined) {
    throw new Error('useSettingsContext必须在SettingsProvider内部使用');
  }
  
  return context;
}; 