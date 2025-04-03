// 背景脚本 - 处理标签页操作和API调用

// 监听扩展消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'closeTabs') {
      closeTabs(message.tabIds);
    } else if (message.action === 'initiateLogin') {
      initiateLogin();
    }
  } catch (error) {
    console.error('背景脚本处理消息时出错:', error);
  }
  
  // 返回true表示将异步发送响应
  return true;
});

// 处理关闭标签页的操作
const closeTabs = async (tabIds: number[]) => {
  if (!tabIds || !tabIds.length) return;
  
  try {
    await chrome.tabs.remove(tabIds);
    console.log('已关闭标签页:', tabIds.length);
  } catch (error) {
    console.error('关闭标签页时出错:', error);
  }
};

// 处理微信登录流程
const initiateLogin = async () => {
  // TODO: 实现微信OAuth流程
  try {
    // 1. 创建一个新的标签页显示微信登录二维码
    const loginTab = await chrome.tabs.create({
      url: chrome.runtime.getURL('wechat-login.html'),
      active: true
    });
    
    // 保存登录标签页ID用于后续处理
    chrome.storage.local.set({ loginTabId: loginTab.id });
    
    // 这里后续会添加与API通信以获取二维码URL和处理回调
  } catch (error) {
    console.error('初始化登录时出错:', error);
  }
};

// 当扩展安装或更新时初始化设置
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('扩展已安装');
    // 初始化存储
    chrome.storage.local.set({
      tabGroups: '[]',
      settings: JSON.stringify({
        autoCloseTabsAfterSaving: true,
        syncEnabled: true
      })
    });
  } else if (details.reason === 'update') {
    console.log('扩展已更新');
  }
});

// 导出只是为了避免TypeScript警告
export {}; 