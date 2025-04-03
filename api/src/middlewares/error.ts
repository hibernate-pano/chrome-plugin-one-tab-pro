import { Context, Next } from 'hono';
import { ZodError } from 'zod';

// 错误处理中间件
export const errorMiddleware = async (c: Context, next: Next) => {
  try {
    // 继续处理请求
    await next();
  } catch (error) {
    console.error('API请求错误:', error);
    
    // 默认错误响应
    let status = 500;
    let errorResponse = {
      success: false,
      error: {
        code: 'internal_server_error',
        message: '服务器内部错误'
      }
    };
    
    // 处理不同类型的错误
    if (error instanceof ZodError) {
      // 验证错误
      status = 400;
      errorResponse.error = {
        code: 'validation_error',
        message: '输入验证失败',
        issues: error.errors
      } as any;
    } else if ((error as any).status && (error as any).message) {
      // 已知HTTP错误
      status = (error as any).status;
      errorResponse.error = {
        code: (error as any).code || `http_${status}`,
        message: (error as any).message
      };
    } else if (error instanceof Error) {
      // 通用错误对象
      errorResponse.error.message = error.message;
    }
    
    // 返回错误响应
    return c.json(errorResponse, status);
  }
}; 