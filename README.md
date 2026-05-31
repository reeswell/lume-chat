# LumeChat

现代化的全栈聊天示例项目，包含账号登录注册、好友、群聊、会话列表、消息历史和 Socket.IO 实时通信。

## 技术栈

- Backend: NestJS + Prisma + PostgreSQL + Redis + TypeScript
- Frontend: Vue 3 + TypeScript + Pinia + Tailwind CSS
- Realtime: Socket.IO gateway on NestJS

## 目录

```text
apps/server              NestJS API、Prisma schema、Socket 网关
apps/web                 Vite Vue 3 前端
packages/shared-types    前后端共享的 API TypeScript 类型
tsconfig.base.json       各包共用的 TypeScript 基座配置
```

前端仍可通过 `@/services/types` 引用类型（内部转发自 `@lume-chat/shared-types`）。后端可直接：

```ts
import type { User } from '@lume-chat/shared-types'
```

## 环境要求

- Node.js 22+
- pnpm 10.12+
- Docker / Docker Compose

## 启动

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

默认服务：

- API: http://localhost:3000/api
- Web: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379

种子账号：

- `alice` / `123456`
- `bob` / `123456`

## 数据库

Prisma 当前只保留一份 PostgreSQL 初始迁移：

```text
apps/server/prisma/migrations/20260531000000_init
```



## 功能

- 登录、注册、JWT 鉴权
- 用户资料读取与更新
- 好友列表、用户搜索、好友申请/同意、删除好友
- 群创建、群搜索、加入、退出、成员列表
- 会话列表、消息历史、已读标记
- Socket.IO 实时收发消息、在线状态广播
- Redis 保存在线用户状态
- 主题切换
