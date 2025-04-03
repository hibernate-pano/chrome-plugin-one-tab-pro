import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { IApiResponse, IAuthState, ITabGroup, IUser } from '../types';

// 创建Axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(async (config) => {
  // 从Chrome存储中获取令牌
  const { authToken } = await chrome.storage.local.get(['authToken']);
  
  if (authToken && config.headers) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  
  return config;
});

// 响应拦截器 - 处理未认证错误
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 如果是认证错误，清除令牌
    if (error.response?.status === 401) {
      await chrome.storage.local.remove(['authToken']);
    }
    return Promise.reject(error);
  }
);

// 包装API调用函数
const callApi = async <T>(config: AxiosRequestConfig): Promise<IApiResponse<T>> => {
  try {
    const response = await api(config);
    return response.data as IApiResponse<T>;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as IApiResponse<T>;
    }
    
    return {
      success: false,
      error: {
        code: 'network_error',
        message: '网络请求失败'
      }
    };
  }
};

// 认证API
export const authApi = {
  // 发起微信登录
  initiateLogin: async (): Promise<string> => {
    // 这里通常会返回一个URL或二维码图像
    return `${api.defaults.baseURL}/auth/wechat-login`;
  },
  
  // 完成微信登录
  completeLogin: async (code: string): Promise<IApiResponse<{ token: string; user: IUser }>> => {
    return callApi({
      method: 'POST',
      url: '/auth/wechat-callback',
      data: { code }
    });
  },
  
  // 验证令牌
  validateToken: async (): Promise<IAuthState> => {
    const response = await callApi<{ user: IUser }>({
      method: 'GET',
      url: '/auth/validate'
    });
    
    if (response.success && response.data) {
      return {
        isLoggedIn: true,
        user: response.data.user
      };
    }
    
    return { isLoggedIn: false };
  }
};

// 标签组API
export const tabGroupApi = {
  // 获取所有标签组
  getAll: async (): Promise<IApiResponse<ITabGroup[]>> => {
    return callApi({
      method: 'GET',
      url: '/tab-groups'
    });
  },
  
  // 获取特定标签组
  getOne: async (id: string): Promise<IApiResponse<ITabGroup>> => {
    return callApi({
      method: 'GET',
      url: `/tab-groups/${id}`
    });
  },
  
  // 创建标签组
  create: async (data: Omit<ITabGroup, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<IApiResponse<ITabGroup>> => {
    return callApi({
      method: 'POST',
      url: '/tab-groups',
      data
    });
  },
  
  // 更新标签组
  update: async (id: string, data: Partial<Pick<ITabGroup, 'name' | 'isLocked' | 'isStarred'>>): Promise<IApiResponse<ITabGroup>> => {
    return callApi({
      method: 'PUT',
      url: `/tab-groups/${id}`,
      data
    });
  },
  
  // 删除标签组
  delete: async (id: string): Promise<IApiResponse<{ id: string }>> => {
    return callApi({
      method: 'DELETE',
      url: `/tab-groups/${id}`
    });
  }
};

// 用户API
export const userApi = {
  // 获取当前用户信息
  getMe: async (): Promise<IApiResponse<IUser>> => {
    return callApi({
      method: 'GET',
      url: '/users/me'
    });
  },
  
  // 更新用户信息
  updateMe: async (data: Partial<Pick<IUser, 'nickname' | 'avatarUrl'>>): Promise<IApiResponse<IUser>> => {
    return callApi({
      method: 'PUT',
      url: '/users/me',
      data
    });
  },
  
  // 获取用户统计信息
  getStats: async (): Promise<IApiResponse<{ tabGroupCount: number; tabCount: number; accountAgeInDays: number }>> => {
    return callApi({
      method: 'GET',
      url: '/users/stats'
    });
  }
}; 