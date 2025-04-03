# OneTabPro 技术背景

## 技术堆栈

### 前端 (Chrome 扩展)

- **主要语言:** TypeScript
- **UI 框架:** React 18
- **样式解决方案:** Tailwind CSS
- **状态管理:** React 上下文 API + 钩子
- **构建工具:** Vite
- **网络请求:** Axios
- **Chrome API:** tabs, storage, runtime

### 后端

- **语言:** Node.js (TypeScript)
- **API 框架:** Hono.js
- **部署环境:** Vercel Serverless Functions
- **认证:** JWT (jsonwebtoken)
- **验证:** Zod

### 数据库

- **服务:** Neon (Serverless PostgreSQL)
- **ORM:** Prisma
- **连接管理:** Prisma Client + Neon 连接池

### 认证

- **主要方式:** 微信扫码登录 (OAuth 2.0)
- **令牌管理:** JWT + chrome.storage.local
- **会话处理:** 无状态 (基于令牌)

## 项目架构

### 扩展架构

扩展项目遵循 Chrome 扩展 Manifest V3 架构，包括：

1. **核心组件:**

   - **Manifest:** 配置文件 (manifest.json)
   - **背景脚本:** 处理事件和 API 调用 (background.js)
   - **弹出 UI:** 提供用户交互界面 (popup.html + React)
   - **内容脚本:** 与网页交互 (尚未实现)

2. **目录结构:**

   ```
   extension/
   ├── public/             # 静态资源
   │   └── icons/          # 扩展图标
   ├── src/
   │   ├── background/     # 后台 Service Worker
   │   ├── components/     # 可复用 UI 组件
   │   ├── hooks/          # 自定义 React Hooks
   │   ├── popup/          # 弹出页面组件
   │   ├── services/       # API 和服务封装
   │   ├── types/          # TypeScript 类型定义
   │   └── utils/          # 工具函数
   ├── manifest.json       # 扩展配置
   ├── popup.html          # 弹出页面入口
   ├── tsconfig.json       # TypeScript 配置
   └── vite.config.ts      # Vite 构建配置
   ```

3. **关键技术实现:**
   - **标签页管理:** 使用 chrome.tabs API 查询、创建和关闭标签页
   - **数据存储:** 使用 chrome.storage.local 存储标签组和认证信息
   - **UI 渲染:** 使用 React 渲染可交互的弹出界面
   - **API 通信:** 使用 Axios 与后端 API 通信

### API 服务架构

API 服务基于 Hono.js 框架实现，采用 RESTful 设计原则：

1. **核心组件:**

   - **应用实例:** 基于 Hono 创建的应用
   - **中间件:** 认证、错误处理、CORS
   - **路由:** 按资源组织的路由组
   - **控制器:** 处理业务逻辑
   - **服务层:** 封装数据访问和业务规则

2. **目录结构:**

   ```
   api/
   ├── prisma/             # Prisma ORM 相关
   │   └── schema.prisma   # 数据库模型定义
   ├── src/
   │   ├── controllers/    # 控制器
   │   ├── middlewares/    # 中间件
   │   ├── models/         # 数据模型
   │   ├── routes/         # 路由定义
   │   ├── services/       # 业务服务
   │   ├── utils/          # 工具函数
   │   └── index.ts        # 应用入口
   ├── .env.example        # 环境变量示例
   ├── package.json        # 项目配置
   └── tsconfig.json       # TypeScript 配置
   ```

3. **API 端点设计:**

   - **/api/auth/**: 认证相关端点
     - POST /wechat-callback: 处理微信登录回调
     - GET /validate: 验证 JWT 令牌
   - **/api/tab-groups/**: 标签组管理
     - GET /: 获取用户的所有标签组
     - POST /: 创建新标签组
     - GET /:id: 获取特定标签组
     - PUT /:id: 更新标签组
     - DELETE /:id: 删除标签组
   - **/api/users/**: 用户管理
     - GET /me: 获取当前用户信息
     - PUT /me: 更新用户信息
     - GET /stats: 获取用户统计信息

4. **标签组管理 API 实现:**

   已实现完整的标签组 CRUD 操作，主要特点包括：

   - **认证中间件集成:**

     ```typescript
     // 应用认证中间件到所有标签组路由
     app.use("/tab-groups/*", authMiddleware);
     ```

   - **获取所有标签组:**

     ```typescript
     app.get("/tab-groups", async (c) => {
       const userId = c.get("userId");
       // 查询用户所有标签组，包括关联的标签页
       const tabGroups = await prisma.tabGroup.findMany({
         where: { userId },
         include: { tabs: true },
         orderBy: { createdAt: "desc" },
       });
       return c.json({ success: true, data: tabGroups });
     });
     ```

   - **创建新标签组:**

     ```typescript
     app.post("/tab-groups", async (c) => {
       // 使用Zod验证请求数据
       const schema = z.object({
         name: z.string().min(1).max(100),
         tabs: z.array(
           z.object({
             title: z.string(),
             url: z.string().url(),
             favicon: z.string().optional(),
           })
         ),
       });

       const result = schema.safeParse(await c.req.json());
       if (!result.success) {
         return c.json(
           {
             success: false,
             error: {
               code: "VALIDATION_ERROR",
               message: "请求数据无效",
             },
           },
           400
         );
       }

       const { name, tabs } = result.data;
       const userId = c.get("userId");

       // 创建标签组和关联的标签页
       const tabGroup = await prisma.tabGroup.create({
         data: {
           name,
           userId,
           tabs: {
             create: tabs.map((tab, index) => ({
               ...tab,
               position: index,
             })),
           },
         },
         include: { tabs: true },
       });

       return c.json({ success: true, data: tabGroup }, 201);
     });
     ```

   - **获取特定标签组:**

     ```typescript
     app.get("/tab-groups/:id", async (c) => {
       const id = c.req.param("id");
       const userId = c.get("userId");

       // 查询特定标签组，确保属于当前用户
       const tabGroup = await prisma.tabGroup.findUnique({
         where: { id, userId },
         include: { tabs: true },
       });

       if (!tabGroup) {
         return c.json(
           {
             success: false,
             error: {
               code: "NOT_FOUND",
               message: "标签组不存在",
             },
           },
           404
         );
       }

       return c.json({ success: true, data: tabGroup });
     });
     ```

   - **更新标签组:**

     ```typescript
     app.put("/tab-groups/:id", async (c) => {
       const id = c.req.param("id");
       const userId = c.get("userId");

       // 先验证标签组存在且属于当前用户
       const existingTabGroup = await prisma.tabGroup.findUnique({
         where: { id, userId },
       });

       if (!existingTabGroup) {
         return c.json(
           {
             success: false,
             error: {
               code: "NOT_FOUND",
               message: "标签组不存在",
             },
           },
           404
         );
       }

       // 验证请求数据
       const schema = z.object({
         name: z.string().min(1).max(100),
         isLocked: z.boolean().optional(),
         isStarred: z.boolean().optional(),
       });

       const result = schema.safeParse(await c.req.json());
       if (!result.success) {
         return c.json(
           {
             success: false,
             error: {
               code: "VALIDATION_ERROR",
               message: "请求数据无效",
             },
           },
           400
         );
       }

       // 更新标签组
       const updatedTabGroup = await prisma.tabGroup.update({
         where: { id },
         data: result.data,
         include: { tabs: true },
       });

       return c.json({ success: true, data: updatedTabGroup });
     });
     ```

   - **删除标签组:**

     ```typescript
     app.delete("/tab-groups/:id", async (c) => {
       const id = c.req.param("id");
       const userId = c.get("userId");

       // 验证标签组存在且属于当前用户
       const existingTabGroup = await prisma.tabGroup.findUnique({
         where: { id, userId },
       });

       if (!existingTabGroup) {
         return c.json(
           {
             success: false,
             error: {
               code: "NOT_FOUND",
               message: "标签组不存在或无权访问",
             },
           },
           404
         );
       }

       // 删除标签组 (关联的标签页会自动级联删除)
       await prisma.tabGroup.delete({
         where: { id },
       });

       return c.json({
         success: true,
         data: { message: "标签组已成功删除" },
       });
     });
     ```

   - **错误处理:**
     ```typescript
     try {
       // 操作逻辑
     } catch (error) {
       console.error("标签组操作错误:", error);
       return c.json(
         {
           success: false,
           error: {
             code: "SERVER_ERROR",
             message: "服务器处理请求时出错",
           },
         },
         500
       );
     }
     ```

5. **认证流程:**
   - 用户发起微信登录
   - 显示二维码给用户扫描
   - 微信服务器回调 API 服务
   - API 服务创建/查找用户并生成 JWT
   - 客户端存储 JWT 并用于认证后续请求

### 数据库架构

使用 Prisma ORM 定义的数据库模型：

1. **核心表:**

   - **用户表 (users):** 存储用户信息和微信认证数据
   - **标签组表 (tab_groups):** 存储标签页组合
   - **标签页表 (tabs):** 存储个别标签页信息

2. **模型关系:**

   - 用户 1:N 标签组 (一个用户可以有多个标签组)
   - 标签组 1:N 标签页 (一个标签组可以包含多个标签页)

3. **模型定义:**

   ```prisma
   // 用户表
   model User {
     id            String     @id @default(uuid())
     wechatOpenId  String     @unique
     wechatUnionId String?    @unique
     nickname      String
     avatarUrl     String
     createdAt     DateTime   @default(now())
     updatedAt     DateTime   @updatedAt
     lastLoginAt   DateTime   @default(now())
     tabGroups     TabGroup[]

     @@map("users")
   }

   // 标签组表
   model TabGroup {
     id        String   @id @default(uuid())
     name      String
     isLocked  Boolean  @default(false)
     isStarred Boolean  @default(false)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     userId    String
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     tabs      Tab[]

     @@index([userId])
     @@map("tab_groups")
   }

   // 标签页表
   model Tab {
     id        String   @id @default(uuid())
     url       String
     title     String
     favicon   String?
     position  Int
     addedAt   DateTime @default(now())
     groupId   String
     group     TabGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)

     @@index([groupId])
     @@map("tabs")
   }
   ```

## 开发环境

1. **本地开发:**

   - **包管理器:** npm
   - **TypeScript 编译器:** tsc + Vite TS 插件
   - **代码风格:** ESLint + TypeScript ESLint
   - **API 测试:** 手动测试 / 未来将添加自动化测试
   - **数据库:** Neon 远程 + Prisma Studio 本地管理

2. **构建过程:**

   - **扩展:** TypeScript -> Vite -> Chrome 扩展包
   - **API:** TypeScript -> tsc/tsx -> Node.js

3. **部署流程:**
   - **API:** 部署到 Vercel
   - **扩展:** 分发到 Chrome Web Store (未来)
   - **数据库:** 托管在 Neon

## 安全考虑

1. **认证安全:**

   - JWT 令牌的安全存储
   - 适当的令牌过期时间
   - 微信回调验证
   - HTTPS 所有 API 通信

2. **数据安全:**

   - 资源访问控制
   - 用户数据隔离
   - 输入验证和净化
   - 防止 SQL 注入 (通过 Prisma)

3. **扩展安全:**
   - 遵循 Chrome 扩展内容安全策略
   - 最小化权限请求
   - 安全处理用户数据

## 性能优化

1. **扩展性能:**

   - 本地缓存标签组数据
   - 延迟加载资源
   - 最小化主线程工作

2. **API 性能:**

   - Serverless 环境优化
   - 有效的数据库查询
   - 适当的缓存策略

3. **数据库性能:**
   - 索引优化
   - 分页查询
   - 连接池管理

## 技术挑战

1. **微信 OAuth 在扩展中的集成:**

   - 处理回调和重定向
   - 二维码显示和扫描流程
   - 无缝的用户体验

2. **多设备同步:**

   - 冲突解决策略
   - 增量同步实现
   - 大型数据集的同步性能

3. **扩展限制:**
   - Manifest V3 的 Service Worker 生命周期限制
   - 跨域资源共享考虑
   - 扩展存储容量限制
