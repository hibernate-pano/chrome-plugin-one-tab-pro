import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../index.js';
import { authMiddleware } from '../middlewares/auth.js';

// 创建标签组路由
export const tabGroupRoutes = new Hono();

// 应用认证中间件到所有路由
tabGroupRoutes.use('*', authMiddleware);

// 获取当前用户的所有标签组
tabGroupRoutes.get('/', async (c) => {
  const user = c.get('user');
  
  try {
    // 获取用户的标签组，包括标签页
    const tabGroups = await prisma.tabGroup.findMany({
      where: { userId: user.id },
      include: { tabs: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return c.json({
      success: true,
      data: tabGroups
    });
  } catch (error) {
    console.error('获取标签组错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'fetch_error',
        message: '获取标签组时出错'
      }
    }, 500);
  }
});

// 创建新标签组
tabGroupRoutes.post('/', async (c) => {
  const user = c.get('user');
  
  // 验证请求体
  const schema = z.object({
    name: z.string().min(1).max(100),
    tabs: z.array(z.object({
      url: z.string().url(),
      title: z.string(),
      favicon: z.string().optional(),
      position: z.number().int().min(0)
    }))
  });
  
  const result = schema.safeParse(await c.req.json());
  
  if (!result.success) {
    return c.json({
      success: false,
      error: {
        code: 'validation_error',
        message: '标签组数据验证失败',
        issues: result.error.errors
      }
    }, 400);
  }
  
  const { name, tabs } = result.data;
  
  try {
    // 创建标签组和标签页
    const newTabGroup = await prisma.tabGroup.create({
      data: {
        name,
        userId: user.id,
        tabs: {
          create: tabs.map(tab => ({
            url: tab.url,
            title: tab.title,
            favicon: tab.favicon,
            position: tab.position
          }))
        }
      },
      include: { tabs: true }
    });
    
    return c.json({
      success: true,
      data: newTabGroup
    }, 201);
  } catch (error) {
    console.error('创建标签组错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'creation_error',
        message: '创建标签组时出错'
      }
    }, 500);
  }
});

// 获取特定标签组
tabGroupRoutes.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  try {
    const tabGroup = await prisma.tabGroup.findUnique({
      where: { id },
      include: { tabs: true }
    });
    
    if (!tabGroup) {
      return c.json({
        success: false,
        error: {
          code: 'not_found',
          message: '找不到标签组'
        }
      }, 404);
    }
    
    // 检查是否属于当前用户
    if (tabGroup.userId !== user.id) {
      return c.json({
        success: false,
        error: {
          code: 'forbidden',
          message: '无权访问此标签组'
        }
      }, 403);
    }
    
    return c.json({
      success: true,
      data: tabGroup
    });
  } catch (error) {
    console.error('获取标签组错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'fetch_error',
        message: '获取标签组时出错'
      }
    }, 500);
  }
});

// 更新标签组
tabGroupRoutes.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  // 验证请求体
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    isLocked: z.boolean().optional(),
    isStarred: z.boolean().optional()
  });
  
  const result = schema.safeParse(await c.req.json());
  
  if (!result.success) {
    return c.json({
      success: false,
      error: {
        code: 'validation_error',
        message: '标签组数据验证失败',
        issues: result.error.errors
      }
    }, 400);
  }
  
  try {
    // 检查标签组是否存在且属于当前用户
    const tabGroup = await prisma.tabGroup.findUnique({
      where: { id }
    });
    
    if (!tabGroup) {
      return c.json({
        success: false,
        error: {
          code: 'not_found',
          message: '找不到标签组'
        }
      }, 404);
    }
    
    if (tabGroup.userId !== user.id) {
      return c.json({
        success: false,
        error: {
          code: 'forbidden',
          message: '无权修改此标签组'
        }
      }, 403);
    }
    
    // 更新标签组
    const updatedTabGroup = await prisma.tabGroup.update({
      where: { id },
      data: result.data,
      include: { tabs: true }
    });
    
    return c.json({
      success: true,
      data: updatedTabGroup
    });
  } catch (error) {
    console.error('更新标签组错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'update_error',
        message: '更新标签组时出错'
      }
    }, 500);
  }
});

// 删除标签组
tabGroupRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  try {
    // 检查标签组是否存在且属于当前用户
    const tabGroup = await prisma.tabGroup.findUnique({
      where: { id }
    });
    
    if (!tabGroup) {
      return c.json({
        success: false,
        error: {
          code: 'not_found',
          message: '找不到标签组'
        }
      }, 404);
    }
    
    if (tabGroup.userId !== user.id) {
      return c.json({
        success: false,
        error: {
          code: 'forbidden',
          message: '无权删除此标签组'
        }
      }, 403);
    }
    
    // 删除标签组 (会级联删除相关标签页)
    await prisma.tabGroup.delete({
      where: { id }
    });
    
    return c.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('删除标签组错误:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'delete_error',
        message: '删除标签组时出错'
      }
    }, 500);
  }
}); 