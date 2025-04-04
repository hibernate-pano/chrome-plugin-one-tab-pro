import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TabGroup } from '../types/models';
import { StorageService } from '../services/storage';
import { TabManager } from '../services/tabManager';

interface TabContextValue {
  tabGroups: TabGroup[];
  activeGroup: string | null;
  loading: boolean;
  error: string | null;
  actions: {
    collectTabs: (windowId?: number, excludeCurrentTab?: boolean) => Promise<TabGroup>;
    restoreTab: (tabId: string) => Promise<boolean>;
    restoreGroup: (groupId: string) => Promise<boolean>;
    deleteGroup: (groupId: string) => Promise<boolean>;
    updateGroup: (groupId: string, updates: Partial<TabGroup>) => Promise<TabGroup | undefined>;
    setActiveGroup: (groupId: string | null) => void;
    refreshTabGroups: () => Promise<void>;
  };
}

const TabContext = createContext<TabContextValue | undefined>(undefined);

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化时加载标签组
  useEffect(() => {
    refreshTabGroups();

    // 监听存储变化
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.tabGroups) {
        setTabGroups(changes.tabGroups.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 刷新标签组列表
  const refreshTabGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const groups = await StorageService.getTabGroups();
      // 按创建时间倒序排列，最新的在前面
      setTabGroups(groups.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载标签组失败');
    } finally {
      setLoading(false);
    }
  };

  // 收集标签页
  const collectTabs = async (windowId?: number, excludeCurrentTab: boolean = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const newGroup = await TabManager.collectTabs(windowId, excludeCurrentTab);
      await refreshTabGroups();
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '收集标签页失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 恢复单个标签页
  const restoreTab = async (tabId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await TabManager.restoreTab(tabId);
      await refreshTabGroups();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '恢复标签页失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 恢复整个标签组
  const restoreGroup = async (groupId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await TabManager.restoreGroup(groupId);
      await refreshTabGroups();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '恢复标签组失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 删除标签组
  const deleteGroup = async (groupId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await StorageService.deleteTabGroup(groupId);
      
      if (activeGroup === groupId) {
        setActiveGroup(null);
      }
      
      await refreshTabGroups();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除标签组失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 更新标签组
  const updateGroup = async (groupId: string, updates: Partial<TabGroup>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await StorageService.updateTabGroup(groupId, updates);
      await refreshTabGroups();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新标签组失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: TabContextValue = {
    tabGroups,
    activeGroup,
    loading,
    error,
    actions: {
      collectTabs,
      restoreTab,
      restoreGroup,
      deleteGroup,
      updateGroup,
      setActiveGroup,
      refreshTabGroups
    }
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
};

// 自定义Hook，便于在组件中使用TabContext
export const useTabContext = () => {
  const context = useContext(TabContext);
  
  if (context === undefined) {
    throw new Error('useTabContext必须在TabProvider内部使用');
  }
  
  return context;
}; 