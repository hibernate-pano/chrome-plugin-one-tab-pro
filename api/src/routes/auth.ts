import { Hono } from 'hono';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

// 创建认证路由
export const authRoutes = new Hono();

// 微信登录回调路由
authRoutes.post('/wechat-callback', async (c) => {
  // 验证请求体
  const schema = z.object({
    code: z.string()
  });
  
  const result = schema.safeParse(await c.req.json());
  
  if (!result.success) {
    return c.json({
      success: false,
      error: {
        code: 'validation_error',
        message: '缺少必要的认证代码',
        issues: result.error.errors
      }
    }, 400);
  }
  
  const { code } = result.data;
  
  try {
    // TODO: 实现实际的微信认证逻辑
    // 下面是模拟实现
    
    // 模拟从微信API获取用户信息
    const mockWechatUserInfo = {
      openid: `wx_openid_${Date.now()}`, // 真实应用中这会从微信获取
      unionid: `wx_unionid_${Date.now()}`, // 真实应用中这会从微信获取
      nickname: '微信用户',
      headimgurl: 'https://example.com/default-avatar.png'
    };
    
    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { wechatOpenId: mockWechatUserInfo.openid }
    });
    
    if (!user) {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          wechatOpenId: mockWechatUserInfo.openid,
          wechatUnionId: mockWechatUserInfo.unionid,
          nickname: mockWechatUserInfo.nickname,
          avatarUrl: mockWechatUserInfo.headimgurl
        }
      });
    } else {
      // 更新现有用户信息
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          nickname: mockWechatUserInfo.nickname,
          avatarUrl: mockWechatUserInfo.headimgurl,
          lastLoginAt: new Date()
        }
      });
    }
    
    // 创建JWT令牌
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-please-change-in-production';
    const token = jwt.sign(
      { userId: user.id }, 
      jwtSecret, 
      { expiresIn: '30d' }
    );
    
    // 返回用户数据和令牌
    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('微信认证错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'auth_error',
        message: '处理认证请求时出错'
      }
    }, 500);
  }
});

// 验证令牌路由
authRoutes.get('/validate', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      valid: false,
      error: {
        code: 'missing_token',
        message: '未提供令牌'
      }
    }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证JWT令牌
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-please-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return c.json({
        success: false,
        valid: false,
        error: {
          code: 'user_not_found',
          message: '用户不存在'
        }
      }, 401);
    }
    
    // 返回验证结果
    return c.json({
      success: true,
      valid: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl
        }
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      valid: false,
      error: {
        code: 'invalid_token',
        message: '无效或过期的令牌'
      }
    }, 401);
  }
}); 