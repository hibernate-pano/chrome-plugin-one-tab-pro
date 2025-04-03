# OneTabPro 技术背景

## 技术栈

### 前端 (Chrome 扩展)

- **框架**: 使用 TypeScript 的 React
- **构建工具**: Vite (用于快速开发和优化构建)
- **状态管理**: 使用 useReducer 的 React Context API
- **样式**: 用于实用优先样式的 TailwindCSS
- **Chrome API**: Chrome 扩展 Manifest V3 APIs
- **HTTP 客户端**: 用于 API 请求的 Axios
- **测试**: Jest 和 React Testing Library

### 后端

- **运行时**: 使用 TypeScript 的 Node.js
- **框架**: Hono.js (轻量级，为 Serverless/Edge 环境优化)
- **认证**: 用于基于令牌认证的 JWT
- **API 文档**: OpenAPI/Swagger
- **验证**: 用于模式验证的 Zod
- **测试**: 用于单元和集成测试的 Vitest

### 数据库

- **数据库**: Neon PostgreSQL (Serverless)
- **ORM**: 用于类型安全数据库查询的 Prisma
- **迁移**: 用于架构变更的 Prisma Migrate
- **连接**: Neon Serverless Driver

### DevOps 和基础设施

- **托管**: 用于 serverless 函数的 Vercel 或 Netlify
- **版本控制**: 使用 GitHub 的 Git
- **CI/CD**: 用于自动化测试和部署的 GitHub Actions
- **监控**: Vercel Analytics 或自定义日志解决方案
- **环境变量**: 通过平台密钥管理

### 第三方集成

- **认证**: 微信 OAuth 2.0
- **网站图标获取**: Google Favicon 服务或类似服务

## 开发环境设置

### 前提条件

- Node.js LTS 版本 (16.x 或更高)
- npm 或 yarn
- Git
- 用于扩展测试的 Chrome 浏览器
- 用于 OAuth 集成的微信开发者账户

### 本地开发环境

1. **扩展开发**:

   - 具有 HMR 的本地开发服务器，用于 UI 更改
   - 从 `dist` 文件夹加载 Chrome 扩展
   - 用于本地与生产 API 端点的环境变量

2. **API 开发**:

   - 具有自动重启功能的本地开发服务器
   - 连接到开发 Neon 数据库实例
   - 用于登录测试的模拟微信 OAuth

3. **数据库开发**:
   - 独立的开发数据库实例
   - 用于数据库可视化的 Prisma Studio
   - 用于测试场景的种子数据

### 仓库结构

```
onetabpro/
├── extension/             # Chrome 扩展代码
│   ├── public/            # 静态资源
│   │   ├── background/    # 后台脚本
│   │   ├── components/    # React 组件
│   │   ├── hooks/         # 自定义 React hooks
│   │   ├── popup/         # 弹出式 UI
│   │   ├── services/      # API 和其他服务
│   │   ├── types/         # TypeScript 类型
│   │   └── utils/         # 辅助工具
│   ├── manifest.json      # 扩展清单
│   └── package.json       # 依赖项
│
├── api/                   # 后端 API 代码
│   ├── src/
│   │   ├── controllers/   # 请求处理器
│   │   ├── middlewares/   # Express 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 辅助函数
│   ├── prisma/            # Prisma 架构和迁移
│   └── package.json       # 依赖项
│
└── web/                   # (可选) Web 客户端
    ├── public/            # 静态资源
    ├── src/               # React 组件和逻辑
    └── package.json       # 依赖项
```

## 技术限制

### Chrome 扩展限制

1. **Manifest V3 限制**:

   - 使用 service workers 而非后台页面
   - 后台脚本的有限执行时间
   - 内容脚本限制
   - 跨域请求限制

2. **存储限制**:

   - `chrome.storage` 大小限制
   - 本地存储配额

3. **安全限制**:
   - 内容安全政策限制
   - 跨域隔离考虑

### Neon PostgreSQL 考虑事项

1. **Serverless 数据库限制**:

   - 连接池要求
   - 冷启动延迟
   - 查询的成本优化

2. **数据访问模式**:
   - 优化读取密集型工作负载
   - 最小化连接开销
   - 索引优化

### 微信 OAuth 限制

1. **认证流程**:

   - 二维码过期时间
   - 回调 URL 要求
   - 速率限制考虑

2. **用户数据访问**:
   - 有限的用户配置信息
   - 范围限制
   - 遵守微信政策

## 安全考虑

### 数据安全

1. **用户数据保护**:

   - 没有未经明确同意存储敏感浏览历史
   - 存储标签数据的加密
   - 用户对数据保留的控制

2. **认证安全**:

   - 扩展中的安全令牌存储
   - 令牌轮换和过期
   - 防止令牌盗窃

3. **API 安全**:
   - 速率限制以防滥用
   - 所有端点的输入验证
   - 适当的错误处理，防止信息泄露

### 扩展安全

1. **内容安全政策**:

   - 限制性 CSP 以防 XSS
   - 最小权限模型
   - 安全的扩展通信

2. **代码安全**:
   - 定期依赖更新
   - 开发过程中的安全 linting
   - 安全问题的代码审查

## 性能考虑

### 扩展性能

1. **启动时间**:

   - 最小包大小
   - 高效的后台 service worker
   - 非关键组件的延迟加载

2. **标签页操作**:
   - 多个标签页的批处理
   - 高容量操作的节流
   - 高效的 DOM 操作

### API 性能

1. **请求优化**:

   - 大数据集的分页
   - 响应压缩
   - 缓存策略

2. **数据库效率**:
   - 频繁查询的适当索引
   - 查询优化
   - 连接池

## 开发工作流

### 代码标准

1. **Linting 和格式化**:

   - 用于代码质量的 ESLint
   - 用于代码格式化的 Prettier
   - TypeScript 严格模式

2. **测试要求**:
   - 关键函数的单元测试
   - API 端点的集成测试
   - 关键用户流程的 E2E 测试

### 开发过程

1. **功能开发**:

   - 功能分支工作流
   - 拉取请求审查
   - 合并前的 CI 验证

2. **发布过程**:
   - 语义化版本控制
   - 更新日志维护
   - 扩展版本更新

### 文档

1. **代码文档**:

   - 函数的 JSDoc 注释
   - 组件的 README 文件
   - 架构文档

2. **API 文档**:
   - OpenAPI/Swagger 定义
   - 端点文档
   - 认证指南
