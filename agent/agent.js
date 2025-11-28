const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');
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
    "agentId": "agent-" + Math.random().toString(36).substr(2, 9),
    "serverUrl": "http://localhost:3001/api/agent",
    "port": 3003,
    "heartbeatInterval": 30000 // 30秒心跳间隔
  };
  // 保存默认配置
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

// 心跳函数，定期向主服务报告状态
function sendHeartbeat() {
  agentInfo.uptime = os.uptime();
  agentInfo.freemem = os.freemem();
  
  axios.post(`${config.serverUrl}/heartbeat`, agentInfo)
    .then(response => {
      console.log('Heartbeat sent successfully');
    })
    .catch(error => {
      console.error('Error sending heartbeat:', error.message);
    });
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

// API路由

// 根路径 - 返回agent信息
app.get('/', (req, res) => {
  res.json({
    message: 'Agent is running',
    agentInfo: agentInfo
  });
});

// 执行命令接口
app.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    console.log(`Executing command: ${command}`);
    
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
  
  // 发送初始心跳
  sendHeartbeat();
  
  // 设置定期心跳
  setInterval(sendHeartbeat, config.heartbeatInterval);
});