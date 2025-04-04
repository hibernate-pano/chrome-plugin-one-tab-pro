import React, { useState } from 'react';
import { useSettingsContext } from '../contexts/SettingsContext';

const SettingsPanel: React.FC = () => {
  const { settings, loading, error, actions } = useSettingsContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // 处理设置项变更
  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      [key]: value
    });
  };

  // 保存设置
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await actions.updateSettings(localSettings);
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 重置为默认设置
  const handleResetSettings = async () => {
    setIsSaving(true);
    try {
      const defaultSettings = await actions.resetSettings();
      setLocalSettings(defaultSettings);
      setIsResetConfirmOpen(false);
    } catch (error) {
      console.error('重置设置失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染确认重置对话框
  const renderResetConfirm = () => {
    if (!isResetConfirmOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">确认重置设置</h3>
          <p className="text-sm text-gray-500 mb-4">
            您确定要将所有设置重置为默认值吗？此操作无法撤销。
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              onClick={handleResetSettings}
            >
              确认重置
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载设置...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>加载设置时出错: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">设置</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {/* 自动同步设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">同步设置</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">启用自动同步</span>
                <p className="text-sm text-gray-500">定期将您的标签组同步到云端</p>
              </div>
              <div className="ml-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.autoSyncEnabled}
                    onChange={(e) => handleSettingChange('autoSyncEnabled', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {localSettings.autoSyncEnabled && (
              <div className="pl-6 border-l-2 border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  同步间隔（分钟）
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  className="block w-full p-2 border border-gray-300 rounded-md"
                  value={localSettings.autoSyncInterval}
                  onChange={(e) => handleSettingChange('autoSyncInterval', parseInt(e.target.value) || 30)}
                />
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* 标签页设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">标签页设置</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">在新标签页中打开</span>
                <p className="text-sm text-gray-500">恢复标签页时在新标签页中打开</p>
              </div>
              <div className="ml-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.openInNewTab}
                    onChange={(e) => handleSettingChange('openInNewTab', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">收集时固定弹出窗口</span>
                <p className="text-sm text-gray-500">收集标签页时保持弹出窗口打开</p>
              </div>
              <div className="ml-4">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.pinPopupWhenCollecting}
                    onChange={(e) => handleSettingChange('pinPopupWhenCollecting', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">
                默认标签组名称格式
              </label>
              <p className="text-xs text-gray-500 mb-1">
                使用 %DATE% 变量插入当前日期
              </p>
              <input
                type="text"
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={localSettings.defaultGroupName}
                onChange={(e) => handleSettingChange('defaultGroupName', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded-md hover:bg-red-50"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            重置为默认
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            保存设置
          </button>
        </div>
      </div>

      {renderResetConfirm()}
    </div>
  );
};

export default SettingsPanel; 