import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client';

import { authRoutes } from './routes/auth.js';
import { tabGroupRoutes } from './routes/tabGroups.js';
import { userRoutes } from './routes/users.js';
import { errorMiddleware } from './middlewares/error.js';

// 初始化Prisma客户端
export const prisma = new PrismaClient();

// 创建Hono应用
const app = new Hono();

// 全局中间件
app.use('*', logger());
app.use('*', errorMiddleware);
app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}));

// 路由分组
app.route('/api/auth', authRoutes);
app.route('/api/tab-groups', tabGroupRoutes);
app.route('/api/users', userRoutes);

// 根路由
app.get('/', (c) => {
  return c.json({
    message: 'OneTabPro API 正在运行',
    version: '0.1.0',
    documentation: '/api/docs'
  });
});

// 文档路由
app.get('/api/docs', (c) => {
  return c.json({
    message: '文档即将推出'
  });
});

// 未找到路由
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'not_found',
      message: '请求的路径不存在'
    }
  }, 404);
});

// 启动服务器
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`服务器正在启动，端口: ${port}...`);

serve({
  fetch: app.fetch,
  port
});

console.log(`服务器已启动: http://localhost:${port}`);

// 处理关闭事件
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('数据库连接已关闭');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('数据库连接已关闭');
  process.exit(0);
});