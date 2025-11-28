# AI-Ops Agent

这是一个分布式agent，可以在Linux服务器上独立运行，接收来自外部服务的指令，在本地执行命令并将结果返回。

## 功能特性

1. 接收并执行远程命令
2. 定期向主服务发送心跳信息
3. 收集并报告系统信息
4. 可通过REST API进行管理和控制

## 安装

### 环境要求

- Node.js (v12或更高版本)
- npm (通常随Node.js一起安装)

### 安装步骤

1. 克隆或下载此项目
2. 运行安装脚本:
   ```bash
   ./install.sh
   ```

或者手动安装:

1. 安装依赖:
   ```bash
   npm install
   ```

## 配置

首次运行时，agent会创建一个配置文件 `agent.config.json`:

```json
{
  "agentId": "agent-xxxxxxxxx",
  "serverUrl": "http://localhost:3001/api/agent",
  "port": 3003,
  "heartbeatInterval": 30000
}
```

可以根据需要修改这些配置:
- `agentId`: agent的唯一标识符
- `serverUrl`: 主服务的URL
- `port`: agent监听的端口
- `heartbeatInterval`: 心跳间隔（毫秒）

## 运行

### 手动运行

```bash
# 运行标准agent
npm start

# 运行增强版agent（支持WebSocket和HTTP）
npm run start:enhanced

# 运行分布式agent（轻量级，仅WebSocket）
npm run start:dist
```

### 使用systemd (推荐在生产环境中使用)

如果安装脚本检测到systemd，它会自动创建服务文件。可以使用以下命令管理服务:

```bash
# 启动服务
sudo systemctl start aiops-agent

# 停止服务
sudo systemctl stop aiops-agent

# 重启服务
sudo systemctl restart aiops-agent

# 设置开机自启
sudo systemctl enable aiops-agent

# 查看服务状态
sudo systemctl status aiops-agent
```

## 分布式Agent (dist-agent)

分布式agent是一个轻量级的独立组件，专为在Linux服务器上运行而设计。它具有以下特点：

1. 仅通过WebSocket与主服务通信
2. 更低的资源占用
3. 自动重连机制
4. 简化的命令执行流程

### 安装分布式Agent

```bash
# 进入agent目录
cd agent

# 安装依赖
npm install

# 运行分布式agent
npm run start:dist
```

或者使用专用安装脚本：

```bash
# 运行分布式agent安装脚本
./install-dist.sh
```

### 配置分布式Agent

分布式agent使用相同的配置文件 `agent.config.json`，但只使用以下字段：
- `agentId`: agent的唯一标识符
- `serverUrl`: 主服务的URL（用于HTTP心跳和结果上报）
- `websocketUrl`: WebSocket服务器地址
- `heartbeatInterval`: 心跳间隔（毫秒）

## API接口

### 获取agent信息

```
GET /
```

### 执行命令

```
POST /execute
Content-Type: application/json

{
  "command": "ls -la"
}
```

### 获取系统信息

```
GET /system-info
```

## 安全注意事项

1. 在生产环境中，应该在防火墙中限制对agent端口的访问
2. 建议使用HTTPS和身份验证来保护API接口
3. 不要在不可信的网络环境中暴露agent的API
4. 对于分布式agent，确保WebSocket连接使用安全的wss://协议