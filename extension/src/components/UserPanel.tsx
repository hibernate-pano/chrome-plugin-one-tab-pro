import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { SyncService } from '../services/syncService';
import { useTabContext } from '../contexts/TabContext';

const UserPanel: React.FC = () => {
  const { user, isLoggedIn, isOnline, loading, error, actions } = useAuthContext();
  const { tabGroups } = useTabContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 处理登录
  const handleLogin = async () => {
    setLoginError(null);
    try {
      await actions.login();
    } catch (error) {
      console.error('登录失败:', error);
      setLoginError('登录失败，请稍后重试');
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await actions.logout();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 手动同步数据
  const handleSync = async () => {
    if (!isLoggedIn || !isOnline) {
      setSyncResult('请先登录并确保网络连接正常');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await SyncService.syncData();
      setSyncResult(result ? '同步成功' : '同步失败');
    } catch (error) {
      console.error('同步失败:', error);
      setSyncResult(`同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 获取同步状态
  const getSyncStatusInfo = async () => {
    try {
      const status = await SyncService.getSyncStatus();
      return status;
    } catch (error) {
      console.error('获取同步状态失败:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">账户</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoggedIn && user ? (
          // 已登录状态
          <div className="p-6">
            <div className="flex items-center mb-6">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || '用户头像'}
                  className="w-16 h-16 rounded-full mr-4"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{user.name || '用户'}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                  <span>{isOnline ? '在线' : '离线'}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">同步信息</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><span className="font-medium">本地标签组数量:</span> {tabGroups.length}</p>
                {/* 这里可以显示更多同步相关信息 */}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                className={`flex items-center px-4 py-2 border rounded-md ${
                  isOnline
                    ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
              >
                {isSyncing ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )}
                立即同步
              </button>

              <button
                className="flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
                onClick={handleLogout}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                退出账户
              </button>
            </div>

            {syncResult && (
              <div className={`mt-4 p-2 text-sm rounded ${
                syncResult.includes('成功') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {syncResult}
              </div>
            )}
          </div>
        ) : (
          // 未登录状态
          <div className="p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">您尚未登录</h3>
            <p className="text-sm text-gray-500 mb-6">
              登录账户后，您可以在多个设备之间同步标签组
            </p>

            <button
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              onClick={handleLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M36 12H39.17C40.27 12 41.16 12.89 41.16 14V33.99C41.16 35.1 40.27 35.99 39.17 35.99H8.84C7.74 35.99 6.84 35.1 6.84 33.99V14C6.84 12.89 7.74 12 8.84 12H12" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M23.93 12H24.07" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M32 18V12H16V18" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M26 28H34" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M26 24H32" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M14 29C16.2091 29 18 27.2091 18 25C18 22.7909 16.2091 21 14 21C11.7909 21 10 22.7909 10 25C10 27.2091 11.7909 29 14 29Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M20 31H8C8 27.7 10.7 25 14 25C17.3 25 20 27.7 20 31Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
              </svg>
              微信登录
            </button>

            {loginError && (
              <div className="mt-4 p-2 text-sm rounded bg-red-100 text-red-800">
                {loginError}
              </div>
            )}

            {error && (
              <div className="mt-4 p-2 text-sm rounded bg-red-100 text-red-800">
                认证错误: {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPanel; 