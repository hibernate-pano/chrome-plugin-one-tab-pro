import React, { useState } from 'react';
import { TabGroup } from '../types/models';
import TabItem from './TabItem';

interface TabGroupItemProps {
  group: TabGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onToggleLock: () => void;
  onRename: (newName: string) => void;
  onSelect?: () => void;
}

const TabGroupItem: React.FC<TabGroupItemProps> = ({
  group,
  isExpanded,
  onToggleExpand,
  onDelete,
  onRestore,
  onToggleLock,
  onRename,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  // 格式化时间戳为可读日期
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 处理重命名提交
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onRename(editName.trim());
      setIsEditing(false);
    }
  };

  // 处理取消重命名
  const handleRenameCancel = () => {
    setEditName(group.name);
    setIsEditing(false);
  };

  // 处理重命名输入框按键
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 标签组标题 */}
      <div 
        className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center space-x-2 flex-grow">
          <button className="text-gray-500">
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex-grow">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                className="w-full px-2 py-1 border border-gray-300 rounded"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </form>
          ) : (
            <h3 className="font-medium text-gray-900 flex-grow">{group.name}</h3>
          )}
          
          <span className="text-xs text-gray-500">
            {formatDate(group.createdAt)}
          </span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-800">
            {group.tabs.length} 个标签页
          </span>
        </div>

        {/* 标签组操作按钮 */}
        <div className="flex space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <>
              <button 
                onClick={handleRenameSubmit}
                className="p-1 text-green-600 hover:text-green-800"
                title="保存"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={handleRenameCancel}
                className="p-1 text-red-600 hover:text-red-800"
                title="取消"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="重命名"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button 
                onClick={onToggleLock}
                className="p-1 text-gray-600 hover:text-gray-800"
                title={group.isLocked ? "解锁" : "锁定"}
              >
                {group.isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                  </svg>
                )}
              </button>
              <button 
                onClick={onRestore}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="恢复所有标签页"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </button>
              {!group.isLocked && (
                <button 
                  onClick={onDelete}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="删除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 标签页列表 */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {group.tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              groupId={group.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TabGroupItem; 