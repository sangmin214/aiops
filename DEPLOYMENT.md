# AI集成的应用运维工具 - 部署指南

本文档将指导您如何部署AI应用运维助手。

## 系统要求

- Node.js >= 14.x
- npm >= 6.x
- Docker (用于运行MongoDB、Qdrant和PostgreSQL)
- DeepSeek API密钥

## 部署架构

```
┌─────────────────┐    HTTP    ┌──────────────────┐
│   用户浏览器     │ ──────────▶ │   前端静态服务器  │
└─────────────────┘            └──────────────────┘
                                       │
                               HTTP API│
                                       ▼
                             ┌──────────────────┐
                             │   后端API服务     │
                             └──────────────────┘
                     ┌─────────────┼─────────────┼──────────────┐
                     │             │             │              │
             MongoDB API     Qdrant API    PostgreSQL API   DeepSeek API
                     │             │             │              │
                     ▼             ▼             ▼              ▼
              ┌──────────┐  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
              │ MongoDB  │  │   Qdrant    │ │  PostgreSQL │ │  DeepSeek   │
              └──────────┘  └─────────────┘ └─────────────┘ └─────────────┘
```

## 基础设施部署

### 使用独立Docker命令启动组件

项目提供了独立的脚本来启动所需的基础设施组件。

1. 启动MongoDB数据库：
   ```bash
   ./start-mongodb.sh
   ```

2. 启动Qdrant向量数据库：
   ```bash
   ./start-qdrant.sh
   ```

3. 启动PostgreSQL数据库：
   ```bash
   ./start-postgresql.sh
   ```

4. 如需停止所有容器：
   ```bash
   ./stop-containers.sh
   ```

## 后端服务部署

1. 进入后端目录：
   ```
   cd backend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 配置环境变量：
   ```
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，填入您的DeepSeek API密钥：
   ```
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PORT=3001
   ```

4. 启动服务：
   ```
   npm start
   ```

   或使用进程管理器（如PM2）运行：
   ```
   npx pm2 start server.js --name aiops-backend
   ```

## 前端应用部署

1. 进入前端目录：
   ```
   cd frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 构建生产版本：
   ```
   npm run build
   ```

4. 部署静态文件：
   构建完成后，将 `build/` 目录中的所有文件部署到您的静态文件服务器或CDN上。

   ### 使用Nginx部署示例：
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/aiops-tool/frontend/build;
           index index.html;
           try_files $uri $uri/ =404;
       }
       
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 环境配置说明

### 后端环境变量

- `DEEPSEEK_API_KEY`: 必需，您的DeepSeek API密钥
- `PORT`: 可选，服务端口，默认3001
- `MONGODB_URI`: MongoDB连接字符串，默认为`mongodb://admin:password@localhost:27017/aiops?authSource=admin`
- `QDRANT_HOST`: Qdrant主机地址，默认为`localhost`
- `QDRANT_PORT`: Qdrant端口，默认为`6333`
- `DB_HOST`: PostgreSQL数据库主机地址，默认为`localhost`
- `DB_PORT`: PostgreSQL数据库端口，默认为`5442`
- `DB_NAME`: PostgreSQL数据库名称，默认为`aiops_db`
- `DB_USER`: PostgreSQL数据库用户名，默认为`aiops_user`
- `DB_PASSWORD`: PostgreSQL数据库密码，默认为`aiops_password`

### 前端配置

前端应用默认向 `http://localhost:3001/api/solve` 发送请求。如果您部署的后端服务地址不同，请相应修改 [src/App.js](file:///Users/licanjing/apps/aiops-tool/frontend/src/App.js) 中的API地址。

## 故障排除

### 后端服务问题

1. 检查DeepSeek API密钥是否正确配置
2. 确认后端服务是否正常运行
3. 检查MongoDB、Qdrant和PostgreSQL容器是否正常启动
4. 检查防火墙设置是否允许相应端口通信

### 前端问题

1. 检查API地址配置是否正确
2. 确认浏览器控制台是否有跨域问题
3. 验证网络连接是否正常

### Docker容器问题

1. 确认Docker服务是否正在运行
2. 检查端口是否被其他进程占用
3. 查看容器日志以获取更多信息：
   ```bash
   docker logs aiops_mongodb
   docker logs aiops_qdrant
   ```

## 监控和日志

### 后端日志

后端服务会将日志输出到控制台，建议使用PM2等进程管理器来管理和查看日志。

### 前端监控

前端应用的错误会显示在浏览器控制台中，可以通过浏览器开发者工具查看。

### 容器日志

可以使用以下命令查看容器日志：

```bash
# 查看MongoDB日志
docker logs aiops_mongodb

# 查看Qdrant日志
docker logs aiops_qdrant

# 查看PostgreSQL日志
docker logs aiops_postgres

# 实时跟踪日志
docker logs -f aiops_mongodb
docker logs -f aiops_qdrant
docker logs -f aiops_postgres
```