const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const http = require('http');
const WebSocket = require('ws');

// 加载环境变量
dotenv.config();

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/aiops?authSource=admin');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// 初始化向量数据库
const { initCollection } = require('./knowledge/qdrant');
initCollection();

// 初始化PostgreSQL数据库和解决方案表
const { sequelize } = require('./component/model');
const Solution = require('./solution/model');

// 同步数据库模型
sequelize.sync()
  .then(() => {
    console.log('PostgreSQL database synced successfully');
  })
  .catch(err => {
    console.error('Error syncing PostgreSQL database:', err);
  });

const app = express();
const PORT = process.env.PORT || 3001;

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 存储已注册的agent信息
let registeredAgents = {};

// 存储命令执行结果
let commandResults = [];

// 导出registeredAgents
module.exports.getRegisteredAgents = () => registeredAgents;
module.exports.registeredAgents = registeredAgents;

// 添加中间件来解析JSON请求体（必须在路由之前）
app.use(express.json());

// CORS配置 - 手动设置CORS头部（放在所有路由之前）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 初始化DeepSeek客户端
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

// AI解决方案API（移到路由注册之前）
app.post('/api/solve', async (req, res) => {
  try {
    console.log('=== AI Solution API Handler STARTED ===');
    const { problem } = req.body;

    if (!problem) {
      console.log('Problem description is missing in request body');
      return res.status(400).json({ error: 'Problem description is required' });
    }

    console.log('=== AI Solution API Called ===');
    console.log('Received problem:', problem);

    // 生成问题的向量嵌入
    console.log('Generating embedding for problem...');
    const problemEmbedding = await generateEmbedding(problem);
    console.log('Generated embedding for problem, length:', problemEmbedding.length);
    
    // 搜索相似的知识库条目
    console.log('Searching for similar entries...');
    const similarEntries = await searchSimilarEntries(problemEmbedding, 5);
    console.log('Found similar entries:', similarEntries.length);
    
    // 打印所有找到的条目及其相似度分数
    if (similarEntries.length > 0) {
      console.log('Similar entries details:');
      similarEntries.forEach((entry, index) => {
        console.log(`  Entry ${index + 1}: Score = ${entry.score}, Problem = ${entry.payload.problem}`);
      });
    } else {
      console.log('No similar entries found');
    }
    
    // 降低相似度阈值，让更多相关条目可以通过
    // 原来的阈值是0.1，现在改为0.05
    const relevantEntries = similarEntries.filter(entry => entry.score > 0.05);
    console.log('Relevant entries after filtering (threshold=0.05):', relevantEntries.length);
    
    // 构建上下文信息
    let context = '';
    let usedKnowledgeBase = false;
    let knowledgeBaseLinks = [];
    
    if (relevantEntries.length > 0) {
      usedKnowledgeBase = true;
      context = '以下是从知识库中找到的相关信息：\n\n';
      relevantEntries.forEach((entry, index) => {
        context += `${index + 1}. 问题：${entry.payload.problem}\n`;
        context += `   根本原因：${entry.payload.rootCause}\n`;
        context += `   解决方案：${entry.payload.solution}\n\n`;
        // 添加知识库条目链接
        knowledgeBaseLinks.push({
          id: entry.id,
          problem: entry.payload.problem,
          score: entry.score
        });
      });
      console.log('Context built from knowledge base entries');
      console.log('Context content:', context);
    } else {
      console.log('No relevant entries found in knowledge base');
    }

    // 构建系统提示词，专注于应用运维领域
    const systemPrompt = `你是一个专业的应用运维专家AI助手。你的任务是帮助用户解决各种应用运维相关的问题。
    
请遵循以下指导原则：
1. 提供清晰、具体且可操作的解决方案
2. 如果涉及命令行操作，请提供具体的命令
3. 如果涉及配置文件修改，请提供示例配置
4. 考虑安全性和最佳实践
5. 解释每一步操作的目的和原理
6. 如果问题不够清晰，请询问更多细节

${context ? context : '没有找到相关的知识库条目。'}用户的问题是：`;

    console.log('System prompt prepared');
    console.log('Context length:', context.length);
    console.log('Full system prompt length:', systemPrompt.length);
    if (context) {
      console.log('Context content preview:', context.substring(0, 200) + '...');
    }

    // 调用DeepSeek API
    console.log('Calling DeepSeek API...');
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat", // 使用DeepSeek API支持的聊天模型
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: problem }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const solution = completion.choices[0].message.content;
    console.log('Solution generated by AI');

    // 返回解决方案以及是否使用了知识库的信息
    res.json({ 
      solution,
      usedKnowledgeBase,
      knowledgeBaseLinks
    });
    console.log('=== AI Solution API Handler COMPLETED ===');
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    res.status(500).json({ error: 'Failed to generate solution' });
  }
});

// 导入知识库路由
const knowledgeRoutes = require('./knowledge/routes');
app.use('/api', knowledgeRoutes);

// 组件依赖关系路由
const componentRoutes = require('./component/routes');
app.use('/api/component', componentRoutes);

// 导入agent路由
const agentRoutes = require('./agent/routes');
app.use('/api', agentRoutes);

// 导入历史事件管理路由
const historicalEventsRoutes = require('./historical-events/routes');
app.use('/api', historicalEventsRoutes);

// 导入解决方案管理路由
const solutionRoutes = require('./solution/routes');
app.use('/api', solutionRoutes);

// 导入向量搜索功能
const { searchSimilarEntries } = require('./knowledge/qdrant');
const { generateEmbedding } = require('./knowledge/embedding');

// 根路径
app.get('/', (req, res) => {
  res.json({ message: 'AI-Ops Backend Service is running!' });
});

// 添加调试接口来查看registeredAgents的完整状态
app.get('/api/debug/agents', (req, res) => {
  try {
    // 创建一个安全的副本，不包含websocket对象
    const safeAgents = {};
    for (const [id, agent] of Object.entries(registeredAgents)) {
      safeAgents[id] = {
        ...agent,
        hasWebsocket: !!agent.websocket,
        websocketReadyState: agent.websocket ? agent.websocket.readyState : null
      };
      // 不删除websocket对象，而是将其设置为null以避免序列化问题
      safeAgents[id].websocket = null;
    }
    res.json(safeAgents);
  } catch (error) {
    console.error('Error fetching debug agents:', error);
    res.status(500).json({ error: 'Failed to fetch debug agents' });
  }
});

// 添加获取单个agent信息的API（用于调试）
app.get('/api/debug/agent/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = registeredAgents[agentId];
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // 创建一个安全的副本
    const safeAgent = {
      ...agent,
      hasWebsocket: !!agent.websocket,
      websocketReadyState: agent.websocket ? agent.websocket.readyState : null,
      websocket: null // 不序列化websocket对象
    };
    
    res.json(safeAgent);
  } catch (error) {
    console.error('Error fetching debug agent:', error);
    res.status(500).json({ error: 'Failed to fetch debug agent' });
  }
});

// 添加获取命令执行结果的API
app.get('/api/agent/results', (req, res) => {
  try {
    // 返回最近的命令执行结果，按时间倒序排列
    const sortedResults = [...commandResults].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    res.json(sortedResults);
  } catch (error) {
    console.error('Error fetching command results:', error);
    res.status(500).json({ error: 'Failed to fetch command results' });
  }
});

// 添加清除命令执行结果的API
app.delete('/api/agent/results', (req, res) => {
  try {
    commandResults = [];
    res.json({ message: 'Command results cleared successfully' });
  } catch (error) {
    console.error('Error clearing command results:', error);
    res.status(500).json({ error: 'Failed to clear command results' });
  }
});

// 处理WebSocket连接
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established from:', req.socket.remoteAddress);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received WebSocket message:', message);
      
      switch (message.type) {
        case 'register':
          // 注册agent
          registeredAgents[message.agentId] = {
            ...message.agentInfo,
            websocket: ws,  // 确保保存websocket引用
            lastHeartbeat: new Date()
          };
          console.log(`Agent ${message.agentId} registered from ${req.socket.remoteAddress}`);
          console.log(`Agent websocket saved:`, registeredAgents[message.agentId].websocket === ws);
          break;
          
        case 'heartbeat':
          // 更新agent心跳和websocket连接（如果需要）
          if (registeredAgents[message.agentId]) {
            // 更新websocket连接（如果连接发生变化）
            if (registeredAgents[message.agentId].websocket !== ws) {
              console.log(`Updating websocket for agent ${message.agentId}`);
              registeredAgents[message.agentId].websocket = ws;
            }
            registeredAgents[message.agentId].lastHeartbeat = new Date();
            console.log(`Heartbeat received from agent ${message.agentId}`);
          }
          break;
          
        case 'result':
          // 处理agent执行结果
          console.log(`Received result from agent ${message.agentId} for command: ${message.command}`);
          console.log('Result:', message.result || message.error);
          
          // 存储命令执行结果
          const resultEntry = {
            id: Date.now().toString(),
            agentId: message.agentId,
            command: message.command,
            result: message.result,
            error: message.error,
            timestamp: new Date()
          };
          commandResults.push(resultEntry);
          
          // 只保留最近的100个结果，防止内存溢出
          if (commandResults.length > 100) {
            commandResults.shift();
          }
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    // 注意：我们不立即删除agent，因为可能会有新的连接
    console.log('WebSocket connection closed');
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`AI-Ops Backend Server is running on port ${PORT}`);
});