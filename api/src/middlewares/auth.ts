import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

// 认证中间件
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  // 检查是否有认证头
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      error: {
        code: 'unauthorized',
        message: '未认证的请求'
      }
    }, 401);
  }
  
  // 提取令牌
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证JWT令牌
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-please-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'user_not_found',
          message: '用户不存在'
        }
      }, 401);
    }
    
    // 将用户附加到请求上下文
    c.set('user', user);
    
    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // 继续处理请求
    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'invalid_token',
        message: '无效或过期的令牌'
      }
    }, 401);
  }
}; 