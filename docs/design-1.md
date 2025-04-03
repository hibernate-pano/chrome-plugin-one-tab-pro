## 一、系统架构概述

### 总体架构

OneTabPro 将采用以下架构设计：

1. **浏览器扩展层**

   - Chrome 扩展（主要)
   - 可选: Firefox、Edge 等浏览器扩展

2. **前端应用层**

   - 扩展内嵌页面
   - Web 应用（用于在任何设备上访问已保存的标签）

3. **后端服务层**

   - API 服务
   - 认证服务
   - 数据同步服务

4. **数据存储层**
   - Neon PostgreSQL 数据库

### 数据流程

```
浏览器扩展 <-> API服务 <-> 数据库
            ^
            |
微信认证服务 <-> 微信OAuth
```

## 二、功能设计

### 保留的 OneTab 原有功能

1. 一键折叠所有标签页到列表
2. 将单个标签添加到列表
3. 恢复单个或全部标签
4. 锁定重要标签组，防止意外删除
5. 标签组命名与管理
6. 标签组分享功能
7. 导入/导出功能

### 新增功能

1. **微信登录与用户管理**

   - 微信扫码登录
   - 用户个人资料管理

2. **云端数据同步**

   - 自动同步已保存标签组到云端
   - 跨设备同步功能
   - 冲突检测与解决机制

3. **增强的数据管理**

   - 标签组分类与标签功能
   - 搜索与过滤功能
   - 添加笔记与备注

4. **个性化设置**
   - 自动同步频率设置
   - 本地/云端存储空间管理
   - 界面自定义选项

## 三、技术栈选择

### 前端技术

1. **浏览器扩展开发**

   - JavaScript/TypeScript
   - React.js - 组件化开发提高维护性
   - TailwindCSS - 快速构建一致的 UI
   - Manifest V3 - 符合 Chrome 最新扩展标准

2. **Web 应用**
   - Next.js - 提供 SSR 与静态生成能力
   - React Query - 优化 API 数据请求与缓存

### 后端技术

1. **服务端开发**

   - Node.js + Express.js - 轻量高效的 API 服务
   - Prisma ORM - 与 Neon PostgreSQL 无缝集成
   - JWT - 处理认证与会话管理

2. **微信认证集成**

   - 微信开放平台 OAuth 2.0 集成

3. **数据库设计**

   - Neon PostgreSQL - 可扩展的云数据库
   - 采用无服务器架构，按需扩展

4. **部署与 DevOps**
   - Docker 容器化
   - CI/CD 自动化部署管道
   - Neon 无服务器环境

## 四、数据库设计

### 主要表结构

1. **用户表 (users)**

   ```
   id: UUID (PK)
   wechat_id: String (唯一)
   nickname: String
   avatar_url: String
   created_at: Timestamp
   updated_at: Timestamp
   ```

2. **标签组表 (tab_groups)**

   ```
   id: UUID (PK)
   user_id: UUID (FK)
   title: String
   is_locked: Boolean
   created_at: Timestamp
   updated_at: Timestamp
   is_shared: Boolean
   share_id: String (唯一，用于公开分享)
   ```

3. **标签表 (tabs)**

   ```
   id: UUID (PK)
   group_id: UUID (FK)
   title: String
   url: String
   favicon: String
   position: Integer
   created_at: Timestamp
   ```

4. **设备表 (devices)**

   ```
   id: UUID (PK)
   user_id: UUID (FK)
   device_name: String
   last_sync: Timestamp
   ```

5. **同步记录表 (sync_logs)**
   ```
   id: UUID (PK)
   user_id: UUID (FK)
   device_id: UUID (FK)
   sync_time: Timestamp
   changes_count: Integer
   status: String
   ```

## 五、API 设计

### 认证 API

- POST `/api/auth/wechat/login` - 微信登录
- POST `/api/auth/refresh` - 刷新认证令牌
- POST `/api/auth/logout` - 登出

### 标签组 API

- GET `/api/tabgroups` - 获取所有标签组
- POST `/api/tabgroups` - 创建新标签组
- GET `/api/tabgroups/:id` - 获取单个标签组
- PUT `/api/tabgroups/:id` - 更新标签组
- DELETE `/api/tabgroups/:id` - 删除标签组
- POST `/api/tabgroups/:id/lock` - 锁定/解锁标签组

### 标签 API

- GET `/api/tabgroups/:groupId/tabs` - 获取标签组中的所有标签
- POST `/api/tabgroups/:groupId/tabs` - 添加标签到组
- PUT `/api/tabs/:id` - 更新标签
- DELETE `/api/tabs/:id` - 删除标签
- POST `/api/tabs/batch` - 批量操作标签

### 同步 API

- GET `/api/sync/status` - 获取同步状态
- POST `/api/sync` - 触发同步
- GET `/api/sync/history` - 获取同步历史

### 分享 API

- POST `/api/share/:groupId` - 创建分享链接
- DELETE `/api/share/:groupId` - 删除分享链接
- GET `/api/share/:shareId` - 获取已分享的标签组

## 六、微信登录流程

1. 用户在 OneTabPro 扩展或网页应用点击"微信登录"
2. 系统生成临时二维码，展示给用户
3. 用户使用微信扫描二维码
4. 微信授权成功后，后端获取用户基本信息
5. 创建或更新用户账户信息
6. 生成 JWT 令牌返回给前端
7. 前端保存令牌并开始数据同步流程

## 七、安全性考虑

1. **数据加密**

   - 所有 API 通信采用 HTTPS
   - 敏感数据存储加密

2. **认证与授权**

   - JWT 令牌自动过期机制
   - 基于角色的访问控制

3. **用户数据隐私**
   - 用户数据不与第三方共享
   - 遵循数据最小化原则
   - 提供数据导出与删除功能

## 八、开发与部署计划

### 开发阶段

1. **阶段一: 基础框架搭建** (3 周)

   - 建立项目结构与代码库
   - 配置开发环境
   - 实现基本插件功能

2. **阶段二: 微信登录集成** (2 周)

   - 实现微信 OAuth 集成
   - 完成用户认证流程

3. **阶段三: 数据同步功能** (3 周)

   - 实现本地与云端数据同步
   - 构建冲突解决机制

4. **阶段四: UI 完善与测试** (2 周)
   - 优化用户界面
   - 进行用户体验测试

### 部署策略

1. **后端服务**

   - 部署到 Neon 平台
   - 配置自动扩展策略

2. **前端应用**

   - 部署到 Vercel 或 Netlify
   - 配置 CDN 提高访问速度

3. **浏览器扩展**
   - 发布到 Chrome Web Store
   - 设置自动更新机制

## 九、成本与资源估算

1. **开发资源**

   - 前端开发: 1-2 人
   - 后端开发: 1 人
   - UI/UX 设计: 1 人

2. **基础设施成本**

   - Neon 数据库: 根据使用量计费
   - 服务器资源: Neon 平台费用
   - 域名与 SSL 证书: 约$20/年

3. **维护成本**
   - 每月维护时间: 约 20 小时
   - 潜在第三方服务费用

## 十、技术选择理由

1. **为什么选择 React 和 Next.js**

   - 组件复用性高，易于维护
   - 拥有丰富的生态系统
   - Next.js 提供良好的 SSR 和静态生成支持

2. **为什么选择 Node.js+Express**

   - 与 JavaScript 前端技术栈一致，降低团队学习成本
   - 异步非阻塞特性适合 IO 密集型应用
   - 与 Neon 的 Serverless 架构兼容性好

3. **为什么选择 Prisma ORM**

   - 类型安全，减少运行时错误
   - 与 TypeScript 完美集成
   - 对 PostgreSQL 支持良好

4. **为什么选择 JWT**
   - 无状态认证，适合分布式系统
   - 可以在客户端存储，减少数据库查询
   - 支持跨域资源共享

以上是 OneTabPro 的完整设计方案。我的技术选择主要考虑了以下因素：

1. 与 Neon 数据库和后端的兼容性
2. 开发效率和可维护性
3. 性能和用户体验
4. 安全性和可扩展性
