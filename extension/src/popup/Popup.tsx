import React, { useEffect, useState } from 'react';

interface TabGroup {
  id: string;
  name: string;
  createdAt: string;
  tabs: Tab[];
}

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon: string;
}

const Popup: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 检查用户是否已登录
    chrome.storage.local.get(['authToken'], (result) => {
      setIsLoggedIn(!!result.authToken);
      setLoading(false);
    });

    // 加载本地存储的标签组
    chrome.storage.local.get(['tabGroups'], (result) => {
      if (result.tabGroups) {
        setGroups(JSON.parse(result.tabGroups));
      }
    });
  }, []);

  const handleSaveCurrentTabs = async () => {
    try {
      setLoading(true);

      // 获取当前窗口中的所有标签页
      const tabs = await chrome.tabs.query({ currentWindow: true });
      
      // 排除扩展自身的标签页
      const filteredTabs = tabs.filter(tab => 
        !tab.url?.includes(chrome.runtime.id)
      );

      // 创建新标签组
      const newGroup: TabGroup = {
        id: Date.now().toString(),
        name: `标签组 ${new Date().toLocaleString('zh-CN')}`,
        createdAt: new Date().toISOString(),
        tabs: filteredTabs.map(tab => ({
          id: tab.id?.toString() || '',
          url: tab.url || '',
          title: tab.title || '',
          favicon: tab.favIconUrl || ''
        }))
      };

      // 添加到组列表
      const updatedGroups = [newGroup, ...groups];
      setGroups(updatedGroups);
      
      // 保存到本地存储
      chrome.storage.local.set({ tabGroups: JSON.stringify(updatedGroups) });

      // 发送消息到背景脚本，关闭这些标签页
      chrome.runtime.sendMessage({
        action: 'closeTabs',
        tabIds: filteredTabs.map(tab => tab.id)
      });
      
      setLoading(false);
    } catch (error) {
      console.error('保存标签页时出错:', error);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // TODO: 触发微信登录流程
    chrome.runtime.sendMessage({ action: 'initiateLogin' });
  };

  const handleRestoreTab = (url: string) => {
    chrome.tabs.create({ url });
  };

  const handleRestoreGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.tabs.forEach(tab => {
        chrome.tabs.create({ url: tab.url });
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">OneTabPro</h1>
        {!isLoggedIn ? (
          <button 
            onClick={handleLogin}
            className="btn-primary text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            微信登录
          </button>
        ) : (
          <div className="text-sm text-gray-600">已登录</div>
        )}
      </header>

      <div className="mb-6">
        <button 
          onClick={handleSaveCurrentTabs}
          className="btn-primary w-full flex justify-center items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          保存所有标签页
        </button>
      </div>

      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            点击上方按钮保存当前标签页
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800">{group.name}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(group.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {group.tabs.map((tab) => (
                  <div 
                    key={tab.id} 
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    onClick={() => handleRestoreTab(tab.url)}
                  >
                    <img 
                      src={tab.favicon || 'default-favicon.png'} 
                      alt=""
                      className="w-4 h-4 mr-2"
                      onError={(e) => (e.currentTarget.src = 'default-favicon.png')}
                    />
                    <span className="text-sm truncate">{tab.title}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => handleRestoreGroup(group.id)}
                  className="text-xs btn-secondary"
                >
                  恢复所有
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Popup; 