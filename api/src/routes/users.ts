import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authMiddleware } from '../middlewares/auth.js';

// 创建用户路由
export const userRoutes = new Hono();

// 应用认证中间件到所有路由
userRoutes.use('*', authMiddleware);

// 获取当前用户信息
userRoutes.get('/me', async (c) => {
  const user = c.get('user');
  
  try {
    // 返回当前用户信息，不包括敏感字段
    return c.json({
      success: true,
      data: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'fetch_error',
        message: '获取用户信息时出错'
      }
    }, 500);
  }
});

// 更新当前用户信息
userRoutes.put('/me', async (c) => {
  const user = c.get('user');
  
  // 验证请求体
  const schema = z.object({
    nickname: z.string().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional()
  });
  
  const result = schema.safeParse(await c.req.json());
  
  if (!result.success) {
    return c.json({
      success: false,
      error: {
        code: 'validation_error',
        message: '用户数据验证失败',
        issues: result.error.errors
      }
    }, 400);
  }
  
  try {
    // 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: result.data
    });
    
    return c.json({
      success: true,
      data: {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
        lastLoginAt: updatedUser.lastLoginAt
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'update_error',
        message: '更新用户信息时出错'
      }
    }, 500);
  }
});

// 获取用户统计信息
userRoutes.get('/stats', async (c) => {
  const user = c.get('user');
  
  try {
    // 获取标签组总数
    const tabGroupCount = await prisma.tabGroup.count({
      where: { userId: user.id }
    });
    
    // 获取标签页总数
    const tabCount = await prisma.tab.count({
      where: {
        group: {
          userId: user.id
        }
      }
    });
    
    // 获取用户账户年龄（天数）
    const accountAgeInDays = Math.floor(
      (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return c.json({
      success: true,
      data: {
        tabGroupCount,
        tabCount,
        accountAgeInDays
      }
    });
  } catch (error) {
    console.error('获取用户统计信息错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'stats_error',
        message: '获取用户统计信息时出错'
      }
    }, 500);
  }
});