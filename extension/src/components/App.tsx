import React, { useState } from 'react';
import { TabProvider } from '../contexts/TabContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { AuthProvider } from '../contexts/AuthContext';
import NavBar from './NavBar';
import TabGroupList from './TabGroupList';
import SettingsPanel from './SettingsPanel';
import UserPanel from './UserPanel';

// 导航项类型
type NavItem = 'groups' | 'settings' | 'user';

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>('groups');

  // 渲染当前激活的内容面板
  const renderActiveContent = () => {
    switch (activeNav) {
      case 'settings':
        return <SettingsPanel />;
      case 'user':
        return <UserPanel />;
      case 'groups':
      default:
        return <TabGroupList />;
    }
  };

  return (
    <AuthProvider>
      <SettingsProvider>
        <TabProvider>
          <div className="w-full h-full flex flex-col bg-gray-50">
            {/* 顶部导航栏 */}
            <NavBar
              activeNav={activeNav}
              onNavChange={setActiveNav}
            />

            {/* 主内容区域 */}
            <main className="flex-1 overflow-auto">
              {renderActiveContent()}
            </main>
          </div>
        </TabProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App; 