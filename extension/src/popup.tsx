import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/global.css';

// 确保DOM完全加载
document.addEventListener('DOMContentLoaded', () => {
  // 获取根元素
  const container = document.getElementById('root');
  
  if (!container) {
    console.error('找不到根元素!');
    return;
  }

  // 创建React根
  const root = createRoot(container);
  
  // 渲染应用
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}); 