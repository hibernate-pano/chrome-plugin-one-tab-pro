# OneTabPro

OneTabPro 是一个 Chrome 扩展，可帮助您通过跨设备云同步高效管理浏览器标签页。它允许您将所有打开的标签页保存为有组织的列表，可以单独或作为一组恢复，并通过微信登录在多个设备之间实现无缝同步。

![OneTabPro 横幅](docs/images/banner.png)

## 功能特点

- **一键标签页管理**：只需单击即可保存当前窗口中的所有标签页
- **云端同步**：在多个设备上访问您保存的标签页
- **微信登录**：通过微信二维码扫描进行安全认证
- **标签组织管理**：命名、锁定和管理您的标签页集合
- **高效内存使用**：通过将标签页转换为列表来减少浏览器内存使用
- **直观界面**：专注于可用性的简洁响应式设计

## 技术栈

### 扩展（前端）

- 使用 TypeScript 的 React
- 使用 TailwindCSS 进行样式设计
- Chrome 扩展 Manifest V3
- 使用 Context API 进行状态管理

### 后端

- 使用 TypeScript 的 Node.js
- 用于 serverless API 的 Hono.js
- JWT 认证
- 部署在 Vercel 上

### 数据库

- Neon PostgreSQL（Serverless）
- 使用 Prisma ORM 进行数据库访问

## 项目结构

```
onetabpro/
├── extension/             # Chrome 扩展代码
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   ├── manifest.json      # 扩展清单
│   └── package.json       # 依赖项
│
├── api/                   # 后端 API 代码
│   ├── src/               # 源代码
│   ├── prisma/            # 数据库模式和迁移
│   └── package.json       # 依赖项
│
├── web/                   # （可选）Web 界面
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   └── package.json       # 依赖项
│
├── docs/                  # 文档
└── memory-bank/           # 项目内存库，包含关键信息
```

## 开始使用

### 前提条件

- Node.js（v16 或更高版本）
- npm 或 yarn
- Chrome 浏览器
- 微信开发者账户（用于 OAuth 集成）
- Neon PostgreSQL 账户

### 本地开发设置

1. **克隆仓库**

```bash
git clone https://github.com/username/onetabpro.git
cd onetabpro
```

2. **设置后端 API**

```bash
cd api
npm install
cp .env.example .env  # 创建并更新环境变量
npm run dev
```

3. **设置 Chrome 扩展**

```bash
cd extension
npm install
npm run dev
```

4. **在 Chrome 中加载扩展**

- 打开 Chrome 并导航到 `chrome://extensions/`
- 启用"开发者模式"
- 点击"加载已解压的扩展程序"并选择 `extension/dist` 目录

### 环境变量

#### API 环境变量

```
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URL=your_wechat_redirect_url
```

#### 扩展环境变量

```
VITE_API_URL=your_api_url
```

## 开发指南

### 提交约定

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 来实现清晰和结构化的提交消息：

- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更改
- `style:` 格式更改
- `refactor:` 代码重构
- `test:` 添加测试
- `chore:` 维护任务

### 拉取请求流程

1. 从 `main` 创建一个描述性的分支
2. 进行更改并按照提交约定提交
3. 推送您的分支并创建拉取请求
4. 等待代码审查并解决反馈
5. 一旦获得批准，您的更改将被合并

### 编码标准

- 使用 TypeScript 确保类型安全
- 遵循 ESLint 和 Prettier 配置
- 为新功能编写全面的测试
- 使用 JSDoc 注释记录您的代码
- 遵循代码库中建立的组件/服务模式

## 部署

### 后端 API 部署

后端 API 作为 Vercel 上的 serverless 函数部署。部署会在 `main` 分支更改时自动触发。

### Chrome 扩展发布

1. 为生产环境构建扩展：

```bash
cd extension
npm run build
```

2. 打包扩展：
   - 导航到 `chrome://extensions/`
   - 点击"打包扩展程序"并选择 `extension/dist` 目录
3. 提交到 Chrome 网上应用店：
   - 在 Chrome 网上应用店创建开发者账户
   - 提交打包的扩展程序，附带所需的截图和描述

## 贡献

欢迎贡献！请阅读我们的 [CONTRIBUTING.md](CONTRIBUTING.md) 了解我们的行为准则和提交拉取请求的流程。

## 许可证

该项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 致谢

- 灵感来源于原始的 OneTab 扩展
- 感谢所有贡献者和用户！
