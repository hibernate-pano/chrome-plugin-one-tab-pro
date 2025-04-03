好的，我们来设计一下 OneTabPro 这个联网版的 OneTab 方案。

**核心目标：**

1.  **保留 OneTab 核心功能：** 一键收纳当前窗口所有标签页，形成一个可管理的列表；可以恢复单个或所有标签页；可以对列表进行命名、锁定、删除等基本管理。
2.  **增加联网同步：** 用户数据（标签页列表）存储在云端数据库，而非浏览器本地存储。
3.  **增加用户系统：** 支持微信扫码登录，允许多设备间同步数据。
4.  **使用指定技术栈：** 后端和数据库均使用 Neon (数据库是 PostgreSQL 兼容的，后端可以理解为部署在 Vercel/Netlify 等 Serverless 平台或 Neon 提供的 Serverless Driver/Edge Functions 环境)。

---

**方案设计**

**1. 整体架构**

这是一个典型的 C/S (Client/Server) 架构：

- **客户端 (Client):** Chrome 浏览器扩展 (OneTabPro Extension)
- **服务端 (Server):** 后端 API 服务 (部署在支持 Neon 的 Serverless 环境)
- **数据库 (Database):** Neon (Serverless PostgreSQL)

**流程示意：**

```mermaid
graph LR
    A[用户@浏览器] -- 1. 操作扩展 --> B(Chrome 扩展);
    B -- 2. 发起 API 请求 (带Token) --> C{后端 API};
    C -- 3. 验证 Token & 操作数据 --> D[(Neon DB)];
    D -- 4. 返回数据 --> C;
    C -- 5. 返回结果 --> B;
    B -- 6. 更新扩展 UI --> A;

    subgraph 登录流程
        E[用户@浏览器] -- L1. 点击微信登录 --> F(Chrome 扩展);
        F -- L2. 请求后端获取登录二维码/URL --> G{后端 API};
        G -- L3. 调用微信接口生成 --> G;
        G -- L4. 返回二维码信息 --> F;
        F -- L5. 显示二维码/跳转 --> E;
        E -- L6. 微信扫码/授权 --> H{微信服务器};
        H -- L7. 回调后端 (带 code) --> G;
        G -- L8. 用 code 换取 AccessToken & 用户信息 --> H;
        H -- L9. 返回用户信息 (OpenID等) --> G;
        G -- L10. 查询/创建用户, 生成 JWT Token --> I[(Neon DB)];
        G -- L11. 返回 JWT Token --> F;
        F -- L12. 安全存储 Token & 更新登录状态 --> E;
    end
```

**2. 组件详解**

- **a. Chrome 扩展 (Frontend)**

  - **职责:**
    - UI 界面：显示标签页列表、登录按钮/状态、操作按钮（保存、恢复、删除、重命名等）。
    - 核心逻辑：监听用户点击扩展图标的事件，获取当前窗口所有标签页的 URL 和 Title。
    - API 通信：调用后端 API 来保存、获取、更新、删除标签页数据；处理登录流程。
    - 状态管理：管理用户的登录状态（是否有有效的 Token）、本地缓存（可选，用于离线查看或提高性能）。
    - 认证处理：存储从后端获取的 JWT Token (需要安全存储，如 `chrome.storage.local`)，并在每次 API 请求时携带。
    - 微信登录交互：向后端请求微信登录二维码信息，展示给用户，并处理登录成功后的 Token 存储。
  - **关键 Chrome API:**
    - `chrome.tabs`: 获取标签页信息 (`query`), 关闭标签页 (`remove`), 创建新标签页 (`create`)。
    - `chrome.action` (or `chrome.browserAction`): 监听扩展图标点击。
    - `chrome.storage.local`: 安全存储 JWT Token 和一些用户设置。
    - `chrome.runtime`: 用于扩展内部通信和获取扩展 URL (可能用于回调)。
    - `chrome.identity` (可选): 如果选择更集成的 OAuth 流程，可以研究此 API，但微信登录通常需要后端配合。

- **b. 后端 API (Backend)**

  - **职责:**
    - 用户认证：处理微信 OAuth 2.0 登录流程，验证微信回调，获取用户信息 (OpenID, UnionID - 如果需要跨应用)，创建或查找用户记录，生成并返回 JWT Token。
    - API 接口：提供 RESTful API 供 Chrome 扩展调用，用于 CRUD (创建、读取、更新、删除) 用户的标签页组 (Tab Groups) 和标签页 (Tabs)。
    - 业务逻辑：处理标签页的保存、恢复逻辑（主要是数据操作）、重命名、删除等。
    - 授权：确保用户只能访问和修改自己的数据（通过 JWT Token 验证用户身份）。
    - 数据库交互：连接 Neon 数据库，执行 SQL 查询或通过 ORM 操作数据。
  - **部署:** 部署在 Serverless 平台（如 Vercel, Netlify, Cloudflare Workers, 或者 Neon 自身的 Serverless Functions/Edge Functions），这些平台通常能很好地配合 Neon 的 Serverless Driver。

- **c. 数据库 (Neon DB - PostgreSQL)**
  - **职责:** 持久化存储用户和标签页数据。
  - **数据模型 (Schema 设计):**
    - `users` 表:
      - `id` (UUID, Primary Key)
      - `wechat_openid` (VARCHAR, Unique, Indexed) - 微信用户的唯一标识 (同一公众号/应用下)
      - `wechat_unionid` (VARCHAR, Nullable, Unique, Indexed) - 跨公众号/应用的用户唯一标识 (如果需要)
      - `nickname` (VARCHAR, Nullable) - 微信昵称
      - `avatar_url` (VARCHAR, Nullable) - 微信头像 URL
      - `created_at` (TIMESTAMPTZ, Default: NOW())
      - `last_login_at` (TIMESTAMPTZ, Nullable)
    - `tab_groups` 表:
      - `id` (UUID, Primary Key)
      - `user_id` (UUID, Foreign Key references users.id, Indexed) - 关联用户
      - `name` (VARCHAR, Default: 'Saved Tabs') - 标签组名称 (用户可修改)
      - `created_at` (TIMESTAMPTZ, Default: NOW())
      - `updated_at` (TIMESTAMPTZ, Default: NOW())
      - `is_locked` (BOOLEAN, Default: FALSE) - 是否锁定 (可选功能)
      - `is_starred` (BOOLEAN, Default: FALSE) - 是否星标 (可选功能)
    - `tabs` 表:
      - `id` (UUID, Primary Key)
      - `group_id` (UUID, Foreign Key references tab_groups.id ON DELETE CASCADE, Indexed) - 关联标签组
      - `url` (TEXT) - 标签页 URL
      - `title` (TEXT) - 标签页标题
      - `favicon_url` (TEXT, Nullable) - 网站图标 URL (可选，增加体验)
      - `added_at` (TIMESTAMPTZ, Default: NOW())
      - `position` (INTEGER, Nullable) - 在组内的排序 (可选，用于保持恢复顺序)

**3. 关键流程细化**

- **微信登录流程:**

  1.  **前端:** 用户点击“微信登录”。
  2.  **前端 -> 后端:** 请求 `/api/auth/wechat/login`。
  3.  **后端:**
      - 生成一个唯一的 `state` 参数 (防 CSRF)。
      - 构建微信扫码登录 URL (包含 `appid`, `redirect_uri`, `response_type=code`, `scope=snsapi_login`, `state`)。 _注意：这里需要申请微信开放平台的网站应用获取 `appid` 和 `secret`。_
      - 将 `state` 暂存 (例如 Redis 或数据库，关联一个 session 或 短期标识)。
      - 返回登录 URL 或二维码所需信息给前端。
  4.  **前端:** 显示二维码或引导用户跳转到微信授权页。
  5.  **用户:** 微信扫码并确认授权。
  6.  **微信 -> 后端 (redirect_uri):** 微信服务器回调后端指定的 `redirect_uri`，附带 `code` 和 `state` 参数。
  7.  **后端:**
      - 验证 `state` 参数是否匹配且有效。
      - 使用 `appid`, `secret`, 和 `code` 向微信服务器请求 `access_token` 和 `openid`。
      - (可选) 使用 `access_token` 和 `openid` 请求用户信息 (`nickname`, `headimgurl`, `unionid` - 如果需要且 scope 允许)。
      - 根据 `openid` (或 `unionid`) 查找数据库中的用户：
        - **找到用户:** 更新 `last_login_at` 和可能的昵称/头像。
        - **未找到用户:** 创建新用户记录。
      - 生成 JWT Token，包含 `user_id` 等信息，设置过期时间。
      - 向前端返回一个成功页面或通过某种机制 (如 postMessage,轮询,WebSocket) 将 JWT Token 传递给 Chrome 扩展。_一个简单的方式是重定向到一个中间页面，该页面通过 JS 将 Token 发送给扩展，然后关闭。_
  8.  **前端 (Chrome 扩展):** 接收并安全存储 JWT Token (`chrome.storage.local`)，更新 UI 为已登录状态。

- **保存标签页流程:**

  1.  **前端:** 用户点击 OneTabPro 图标。
  2.  **前端:** 使用 `chrome.tabs.query({currentWindow: true, pinned: false})` 获取当前窗口所有非固定标签页信息 (URL, Title, favIconUrl)。
  3.  **前端:** 准备包含这些标签页数据的 payload。
  4.  **前端 -> 后端:** 发送 POST 请求到 `/api/groups`，在 Header 中携带 `Authorization: Bearer <JWT_Token>`，请求体包含标签页数据。
  5.  **后端:**
      - 验证 JWT Token，解析出 `user_id`。
      - 在 `tab_groups` 表中为该 `user_id` 创建一条新记录。
      - 获取新生成的 `group_id`。
      - 将 payload 中的每个标签页数据，在 `tabs` 表中创建记录，关联 `group_id`。
      - 关闭原标签页（这一步由前端在 API 调用成功后执行，使用 `chrome.tabs.remove(tabIds)`）。
      - 返回成功响应，可以包含新创建的 group 信息。
  6.  **前端:** 收到成功响应后，调用 `chrome.tabs.remove()` 关闭原始标签页，并更新扩展 UI 显示新的标签组。

- **同步数据流程:**
  1.  **前端:** 扩展启动时，或用户登录成功时。
  2.  **前端 -> 后端:** 发送 GET 请求到 `/api/groups` (带 Token)。
  3.  **后端:**
      - 验证 Token，获取 `user_id`。
      - 查询数据库，获取该 `user_id` 下的所有 `tab_groups` 及其关联的 `tabs`。
      - 返回数据给前端。
  4.  **前端:** 渲染从后端获取的标签页列表。

---

**技术选型**

- **数据库:** **Neon (PostgreSQL)** - 用户已指定。优点是 Serverless、可扩展、按需付费、提供连接池和 Serverless Driver。
- **后端:**
  - **语言/运行时:** **Node.js (使用 TypeScript)** - 非常适合 I/O 密集型的 API 服务，与 JavaScript 前端语言统一，生态系统庞大，TypeScript 增加类型安全。
  - **框架:** **Hono** 或 **Fastify** 或 **Express**。
    - **Hono:** 轻量级，性能好，特别适合 Edge/Serverless 环境。推荐。
    - **Fastify:** 性能优异，插件体系完善。
    - **Express:** 最流行，生态成熟，学习资源多，但相对较重。
  - **部署平台:** **Vercel / Netlify / Cloudflare Workers / Neon Serverless Functions** - 这些平台都很好地支持 Node.js Serverless Functions，并且与 Neon DB 集成方便 (尤其是 Vercel 与 Neon 有深度集成)。
  - **数据库交互:** **Prisma** 或 **node-postgres (pg)**。
    - **Prisma:** 强大的 ORM，提供类型安全的数据库查询、迁移管理，与 TypeScript 结合体验极佳，尤其适合 Serverless 环境（有 Data Proxy 或优化过的 Driver）。强烈推荐。
    - **node-postgres (pg):** 官方 PostgreSQL 客户端，更底层，灵活但需要手写 SQL 或配合 Query Builder。
  - **认证:** **jsonwebtoken** (用于生成/验证 JWT), **axios/node-fetch** (用于请求微信 API)。微信 OAuth 逻辑可以手写或查找合适的库 (注意库的维护状态)。
- **前端 (Chrome 扩展):**
  - **核心:** **HTML, CSS, JavaScript (ES6+)**
  - **框架 (可选但推荐):** **React** 或 **Vue** 或 **Svelte**。使用框架可以更方便地构建交互式 UI 和管理状态。React 在扩展开发中比较流行。
  - **构建工具:** **Vite** 或 **Webpack**。Vite 开发体验更好，速度快。Webpack 配置更灵活，生态更久。
  - **UI 库 (可选):** **Tailwind CSS** (实用类优先), **Chakra UI**, **MUI (Material UI)** 等，加速 UI 开发。
  - **API Client:** **axios** 或 原生 `fetch`。

**为什么选择这些技术？**

- **Neon DB:** 用户指定，且本身是现代化的 Serverless PostgreSQL 解决方案，适合需要弹性伸缩和按需付费的场景。
- **Node.js (TypeScript):** 性能足够，非阻塞 I/O 适合 API，与前端语言一致减少上下文切换，TypeScript 提高代码质量和可维护性。
- **Hono/Fastify/Express (on Serverless):** 满足 API 开发需求，选择哪个取决于对性能、轻量级和生态的需求。Serverless 部署模式与 Neon DB 的 Serverless 特性相得益彰，易于扩展且成本优化。
- **Prisma:** 大幅简化数据库交互，类型安全，迁移方便，特别是在 TypeScript 项目中优势明显。
- **React/Vue/Svelte:** 现代前端框架能显著提高开发效率和 UI 复杂度管理能力。
- **Vite:** 提供极佳的开发体验。
- **JWT:** 无状态认证的标准方案，适合分布式/Serverless 架构。

---

**下一步**

现在你已经有了一个比较完整的方案设计和技术选型建议。你可以根据这个方案：

1.  **确认技术选型：** 是否同意推荐的技术栈？或者有其他偏好？
2.  **细化需求：** 是否需要 OneTab 的所有高级功能（如锁定、星标、导出导入）？优先级如何？
3.  **启动开发：**
    - 搭建后端项目结构，配置 Neon 数据库连接。
    - 实现用户认证（微信登录）流程。
    - 开发核心的 CRUD API。
    - 搭建 Chrome 扩展项目结构。
    - 开发扩展 UI 和核心的标签页获取/保存逻辑。
    - 连接前后端，实现数据同步。

这个项目涉及前端（浏览器扩展）、后端（API）、数据库和第三方服务（微信开放平台），需要一定的全栈开发能力。祝你项目顺利！如果你在后续开发中有具体问题，随时可以再提问。
