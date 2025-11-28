const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'agent.config.json');

// 读取配置文件
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} else {
  // 默认配置
  config = {
    "agentId": "agent-" + Math.random().toString(36).substr(2, 9),
    "serverUrl": "http://localhost:3001/api/agent",
    "websocketUrl": "ws://localhost:3001/",
    "port": 3003,
    "heartbeatInterval": 30000 // 30秒心跳间隔
  };
  // 保存默认配置
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// 确保websocketUrl存在
if (!config.websocketUrl) {
  config.websocketUrl = "ws://localhost:3001/";
  // 更新配置文件
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const app = express();
const PORT = process.env.AGENT_PORT || config.port;

// 中间件
app.use(express.json());

// 存储agent信息
const agentInfo = {
  id: config.agentId,
  hostname: os.hostname(),
  platform: os.platform(),
  arch: os.arch(),
  uptime: os.uptime(),
  totalmem: os.totalmem(),
  freemem: os.freemem()
};

// WebSocket连接
let ws = null;

// 连接到主服务的WebSocket服务器
function connectWebSocket() {
  ws = new WebSocket(config.websocketUrl);
  
  ws.on('open', function open() {
    console.log('Connected to WebSocket server');
    
    // 发送注册消息
    ws.send(JSON.stringify({
      type: 'register',
      agentId: agentInfo.id,
      agentInfo: agentInfo
    }));
  });
  
  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'command':
          handleCommand(message.command);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', function close() {
    console.log('Disconnected from WebSocket server');
    // 尝试重新连接
    setTimeout(connectWebSocket, 5000);
  });
  
  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
  });
}

// 心跳函数，定期向主服务报告状态
function sendHeartbeat() {
  agentInfo.uptime = os.uptime();
  agentInfo.freemem = os.freemem();
  
  // 通过HTTP发送心跳
  axios.post(`${config.serverUrl}/heartbeat`, agentInfo)
    .then(response => {
      console.log('Heartbeat sent successfully');
    })
    .catch(error => {
      console.error('Error sending heartbeat:', error.message);
    });
  
  // 通过WebSocket发送心跳
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      agentId: agentInfo.id,
      agentInfo: agentInfo
    }));
  }
}

// 执行命令函数
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd(), timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// 处理命令执行
async function handleCommand(command) {
  console.log(`Executing command: ${command}`);
  
  try {
    const result = await executeCommand(command);
    
    // 发送结果回主服务
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'result',
        agentId: agentInfo.id,
        command: command,
        result: result
      }));
    }
    
    // 同时通过HTTP发送结果（备用方案）
    try {
      await axios.post(`${config.serverUrl}/result`, {
        agentId: agentInfo.id,
        command,
        result
      });
    } catch (error) {
      console.error('Error sending result to server via HTTP:', error.message);
    }
    
    console.log('Command executed successfully');
  } catch (error) {
    console.error('Command execution failed:', error);
    
    // 发送错误结果回主服务
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'result',
        agentId: agentInfo.id,
        command: command,
        error: error
      }));
    }
  }
}

// API路由

// 根路径 - 返回agent信息
app.get('/', (req, res) => {
  res.json({
    message: 'Agent is running',
    agentInfo: agentInfo
  });
});

// 执行命令接口（HTTP方式）
app.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    console.log(`Executing command via HTTP: ${command}`);
    
    const result = await executeCommand(command);
    
    // 将结果发送回主服务
    try {
      await axios.post(`${config.serverUrl}/result`, {
        agentId: agentInfo.id,
        command,
        result
      });
    } catch (error) {
      console.error('Error sending result to server:', error.message);
    }
    
    res.json({
      message: 'Command executed successfully',
      command,
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Command execution failed',
      command,
      details: error
    });
  }
});

// 获取系统信息
app.get('/system-info', (req, res) => {
  const info = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: os.uptime(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus(),
    networkInterfaces: os.networkInterfaces(),
    loadavg: os.loadavg()
  };
  
  res.json(info);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Agent ${agentInfo.id} is running on port ${PORT}`);
  
  // 连接WebSocket
  connectWebSocket();
  
  // 发送初始心跳
  sendHeartbeat();
  
  // 设置定期心跳
  setInterval(sendHeartbeat, config.heartbeatInterval);
});