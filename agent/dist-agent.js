#!/usr/bin/env node

const WebSocket = require('ws');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, 'agent.config.json');

// 读取配置文件
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} else {
  // 默认配置
  config = {
    "agentId": "dist-agent-" + Math.random().toString(36).substr(2, 9),
    "serverUrl": "http://localhost:3001/api/agent",
    "websocketUrl": "ws://localhost:3001/",
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
let reconnectTimeout = null;

console.log(`Distributed Agent ${agentInfo.id} starting...`);

// 连接到主服务的WebSocket服务器
function connectWebSocket() {
  // 清除之前的重连定时器
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  console.log(`Connecting to WebSocket server at ${config.websocketUrl}`);
  ws = new WebSocket(config.websocketUrl);
  
  ws.on('open', function open() {
    console.log('Connected to WebSocket server');
    
    // 发送注册消息
    const registerMessage = {
      type: 'register',
      agentId: agentInfo.id,
      agentInfo: agentInfo
    };
    
    ws.send(JSON.stringify(registerMessage));
    console.log('Registration message sent');
    
    // 发送初始心跳
    sendHeartbeat();
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
    scheduleReconnect();
  });
  
  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
    // 尝试重新连接
    scheduleReconnect();
  });
}

// 安排重连
function scheduleReconnect() {
  if (!reconnectTimeout) {
    console.log('Scheduling reconnection in 5 seconds...');
    reconnectTimeout = setTimeout(connectWebSocket, 5000);
  }
}

// 心跳函数，定期向主服务报告状态
function sendHeartbeat() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    agentInfo.uptime = os.uptime();
    agentInfo.freemem = os.freemem();
    
    const heartbeatMessage = {
      type: 'heartbeat',
      agentId: agentInfo.id,
      agentInfo: agentInfo
    };
    
    ws.send(JSON.stringify(heartbeatMessage));
    console.log('Heartbeat sent');
  }
  
  // 安排下一次心跳
  setTimeout(sendHeartbeat, config.heartbeatInterval);
}

// 执行命令函数
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    
    exec(command, { cwd: process.cwd(), timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// 处理命令执行
async function handleCommand(command) {
  console.log(`Handling command: ${command}`);
  
  try {
    const result = await executeCommand(command);
    
    // 发送成功结果回主服务
    if (ws && ws.readyState === WebSocket.OPEN) {
      const resultMessage = {
        type: 'result',
        agentId: agentInfo.id,
        command: command,
        result: result
      };
      
      ws.send(JSON.stringify(resultMessage));
      console.log('Command result sent successfully');
    }
  } catch (error) {
    console.error('Command execution failed:', error);
    
    // 发送错误结果回主服务
    if (ws && ws.readyState === WebSocket.OPEN) {
      const errorMessage = {
        type: 'result',
        agentId: agentInfo.id,
        command: command,
        error: error
      };
      
      ws.send(JSON.stringify(errorMessage));
      console.log('Command error sent');
    }
  }
}

// 启动agent
function startAgent() {
  console.log(`Starting Distributed Agent ${agentInfo.id}`);
  console.log(`Platform: ${agentInfo.platform} ${agentInfo.arch}`);
  console.log(`Hostname: ${agentInfo.hostname}`);
  
  // 连接WebSocket
  connectWebSocket();
}

// 处理进程退出
process.on('SIGINT', function() {
  console.log('\nShutting down agent...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', function() {
  console.log('\nShutting down agent...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// 启动agent
startAgent();