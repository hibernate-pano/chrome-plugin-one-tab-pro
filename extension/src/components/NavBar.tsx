import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTabContext } from '../contexts/TabContext';

// 导航项类型
type NavItem = 'groups' | 'settings' | 'user';

interface NavBarProps {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeNav, onNavChange }) => {
  const { isLoggedIn, isOnline } = useAuthContext();
  const { actions } = useTabContext();

  // 处理收集所有标签页
  const handleCollectAllTabs = async () => {
    try {
      await actions.collectTabs(undefined, true);
    } catch (error) {
      console.error('收集标签页失败:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo和标题 */}
        <div className="flex items-center">
          <img
            src="/images/icon-48.png"
            alt="OneTabPro Logo"
            className="w-8 h-8 mr-2"
          />
          <h1 className="text-lg font-semibold text-gray-900">OneTabPro</h1>
          
          {/* 在线状态指示器 */}
          {isLoggedIn && (
            <div className="ml-3 flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="ml-1 text-xs text-gray-500">
                {isOnline ? '已连接' : '离线'}
              </span>
            </div>
          )}
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center space-x-2">
          {/* 收集标签页按钮 */}
          <button
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleCollectAllTabs}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            收集标签页
          </button>
        </div>
      </div>

      {/* 导航选项卡 */}
      <nav className="px-4 border-b border-gray-200">
        <div className="flex -mb-px">
          <button
            className={`mr-8 py-2 border-b-2 font-medium text-sm ${
              activeNav === 'groups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onNavChange('groups')}
          >
            我的标签组
          </button>
          <button
            className={`mr-8 py-2 border-b-2 font-medium text-sm ${
              activeNav === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onNavChange('settings')}
          >
            设置
          </button>
          <button
            className={`mr-8 py-2 border-b-2 font-medium text-sm ${
              activeNav === 'user'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => onNavChange('user')}
          >
            账户
          </button>
        </div>
      </nav>
    </header>
  );
};

export default NavBar; 