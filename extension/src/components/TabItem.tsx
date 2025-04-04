import React from 'react';
import { Tab } from '../types/models';
import { useTabContext } from '../contexts/TabContext';
import { useSettingsContext } from '../contexts/SettingsContext';

interface TabItemProps {
  tab: Tab;
  groupId: string;
}

const TabItem: React.FC<TabItemProps> = ({ tab, groupId }) => {
  const { actions } = useTabContext();
  const { settings } = useSettingsContext();

  // 处理恢复单个标签页
  const handleRestoreTab = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await actions.restoreTab(tab.id);
    } catch (error) {
      console.error('恢复标签页失败:', error);
    }
  };

  // 提取域名
  const getDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (error) {
      return '未知域名';
    }
  };

  // 截断长标题
  const truncateTitle = (title: string, maxLength: number = 60): string => {
    return title.length > maxLength
      ? `${title.substring(0, maxLength)}...`
      : title;
  };

  return (
    <div
      className="px-4 py-2 hover:bg-gray-50 flex items-center"
      title={`${tab.title}\n${tab.url}`}
      onClick={handleRestoreTab}
    >
      {/* 网站图标 */}
      <div className="mr-3 flex-shrink-0">
        {tab.favicon ? (
          <img
            src={tab.favicon}
            alt=""
            className="w-5 h-5"
            onError={(e) => {
              // 图标加载失败时使用默认图标
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';
            }}
          />
        ) : (
          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* 标签页信息 */}
      <div className="flex-grow truncate">
        <div className="text-sm font-medium text-gray-900 truncate">{truncateTitle(tab.title)}</div>
        <div className="text-xs text-gray-500 truncate">{getDomain(tab.url)}</div>
      </div>

      {/* 操作按钮 */}
      <div className="ml-2">
        <button
          className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
          onClick={handleRestoreTab}
          title="恢复此标签页"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TabItem; 