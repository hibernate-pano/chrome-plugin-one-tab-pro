import React, { useState } from 'react';
import { TabGroup } from '../types/models';
import { useTabContext } from '../contexts/TabContext';
import TabGroupItem from './TabGroupItem';
import EmptyState from './EmptyState';

interface TabGroupListProps {
  onSelectGroup?: (groupId: string) => void;
}

const TabGroupList: React.FC<TabGroupListProps> = ({ onSelectGroup }) => {
  const { tabGroups, loading, error, actions } = useTabContext();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 切换标签组的展开/折叠状态
  const toggleGroupExpand = (groupId: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupId)) {
      newExpandedGroups.delete(groupId);
    } else {
      newExpandedGroups.add(groupId);
    }
    setExpandedGroups(newExpandedGroups);
  };

  // 处理标签组的删除
  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('确定要删除这个标签组吗？此操作无法撤销。')) {
      try {
        await actions.deleteGroup(groupId);
      } catch (error) {
        console.error('删除标签组失败:', error);
      }
    }
  };

  // 处理标签组的恢复
  const handleRestoreGroup = async (groupId: string) => {
    try {
      await actions.restoreGroup(groupId);
    } catch (error) {
      console.error('恢复标签组失败:', error);
    }
  };

  // 处理标签组的锁定/解锁
  const handleToggleLock = async (groupId: string, isLocked: boolean) => {
    try {
      await actions.updateGroup(groupId, { isLocked: !isLocked });
    } catch (error) {
      console.error('更新标签组失败:', error);
    }
  };

  // 处理标签组重命名
  const handleRenameGroup = async (groupId: string, newName: string) => {
    try {
      await actions.updateGroup(groupId, { name: newName });
    } catch (error) {
      console.error('重命名标签组失败:', error);
    }
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载标签组...</p>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>加载标签组时出错: {error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => actions.refreshTabGroups()}
        >
          重试
        </button>
      </div>
    );
  }

  // 如果没有标签组，显示空状态
  if (tabGroups.length === 0) {
    return (
      <EmptyState 
        title="还没有保存的标签页"
        description="点击扩展图标保存当前窗口的标签页，或者使用"收集所有标签页"按钮保存所有窗口的标签页。"
        actionText="收集所有标签页"
        onAction={() => actions.collectTabs(undefined, true)}
      />
    );
  }

  // 渲染标签组列表
  return (
    <div className="space-y-4 p-4">
      {tabGroups.map((group) => (
        <TabGroupItem
          key={group.id}
          group={group}
          isExpanded={expandedGroups.has(group.id)}
          onToggleExpand={() => toggleGroupExpand(group.id)}
          onDelete={() => handleDeleteGroup(group.id)}
          onRestore={() => handleRestoreGroup(group.id)}
          onToggleLock={() => handleToggleLock(group.id, group.isLocked)}
          onRename={(newName) => handleRenameGroup(group.id, newName)}
          onSelect={() => onSelectGroup && onSelectGroup(group.id)}
        />
      ))}
    </div>
  );
};

export default TabGroupList; 