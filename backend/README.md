# AI-Ops 后端服务

这是AI应用运维助手的后端服务，提供AI集成的API接口。

## 功能特性

- 接收用户问题描述
- 调用OpenAI API生成解决方案
- 返回结构化响应数据

## 技术栈

- Node.js
- Express.js
- OpenAI SDK

## 安装与运行

1. 安装依赖：
   ```
   npm install
   ```

2. 配置环境变量：
   复制 [.env.example](.env.example) 文件为 `.env` 并填入您的OpenAI API密钥：
   ```
   cp .env.example .env
   ```

3. 启动服务：
   ```
   npm start
   ```

   开发模式下可以使用：
   ```
   npm run dev
   ```

## API接口

### 获取解决方案

- **URL**: `/api/solve`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "problem": "您的问题描述"
  }
  ```
- **响应**:
  ```json
  {
    "solution": "AI生成的解决方案"
  }
  ```

## 环境变量

- `OPENAI_API_KEY`: OpenAI API密钥
- `PORT`: 服务运行端口，默认3001