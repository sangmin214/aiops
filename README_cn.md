# AI集成的应用运维工具 (AI-Ops Tool)

这是一个集成了AI大模型的应用运维工具，允许用户通过自然语言描述问题并获得解决方案。

## 功能特性

1. AI大模型集成 - 用户可以通过自然语言描述运维问题
2. 智能解决方案生成 - 基于问题描述提供详细的解决方案
3. 应用运维专用 - 针对常见的应用运维场景进行优化
4. 知识库管理 - 存储和管理运维知识
5. 组件依赖管理 - 管理应用组件及其依赖关系
6. 分布式Agent管理 - 管理部署在不同节点的监控Agent
7. 历史事件管理 - 记录和分析历史运维事件

## 项目结构

```
aiops-tool/
├── backend/          # 后端服务
│   ├── agent/        # Agent管理模块
│   ├── component/    # 组件依赖管理模块
│   ├── historical-events/  # 历史事件管理模块
│   ├── knowledge/    # 知识库管理模块
│   ├── solution/     # 解决方案管理模块
│   └── server.js     # 后端主服务
├── frontend/         # 前端界面
└── README.md
```

## 技术栈

- 前端: React + TailwindCSS
- 后端: Node.js + Express
- 数据库: PostgreSQL (组件依赖), MongoDB (知识库和解决方案)
- AI集成: DeepSeek API
- 容器化: Docker Compose

## 模块详细介绍

### 解决方案管理
- 自然语言问题描述转解决方案
- 解决方案的创建、编辑、删除
- 从知识库条目转换为解决方案

### 知识库管理
- 运维知识的增删改查
- 知识条目的向量化存储
- 与解决方案的联动

### 组件依赖管理
- 组件及其依赖关系的可视化
- 手动添加组件依赖
- Excel批量导入组件依赖
- 组件依赖关系图展示

### 分布式Agent管理
- Agent的注册和状态监控
- Agent的增删改查

### 历史事件管理
- 运维事件的记录和查询
- 历史事件的统计分析
- Excel导入历史事件（支持去重）

## 快速开始

1. 启动基础服务:
   ```bash
   ./start-postgresql.sh
   ./start-mongodb.sh
   ./start-qdrant.sh
   ```

2. 启动后端服务:
   ```bash
   cd backend
   npm install
   node server.js
   ```

3. 启动前端服务:
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. 访问应用:
   前端: http://localhost:3002
   后端API: http://localhost:3001

## 部署

参考 [DEPLOYMENT.md](DEPLOYMENT.md) 文件获取详细的部署说明。