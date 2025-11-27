const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');

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

const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置 - 允许所有来源（生产环境中应该限制）
app.use(cors({
  origin: true, // 允许任何来源
  credentials: true // 允许携带凭证
}));

app.use(express.json());

// 初始化DeepSeek客户端
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

// 导入知识库路由
const knowledgeRoutes = require('./knowledge/routes');
app.use('/api', knowledgeRoutes);

// 组件依赖关系路由
const componentRoutes = require('./component/routes');
app.use('/api/component', componentRoutes);

// 导入向量搜索功能
const { searchSimilarEntries } = require('./knowledge/qdrant');
const { generateEmbedding } = require('./knowledge/embedding');

// 根路径
app.get('/', (req, res) => {
  res.json({ message: 'AI-Ops Backend Service is running!' });
});

// AI解决方案API
app.post('/api/solve', async (req, res) => {
  try {
    const { problem } = req.body;

    if (!problem) {
      return res.status(400).json({ error: 'Problem description is required' });
    }

    // 生成问题的向量嵌入
    const problemEmbedding = await generateEmbedding(problem);
    
    // 搜索相似的知识库条目
    const similarEntries = await searchSimilarEntries(problemEmbedding, 3);
    
    // 构建上下文信息
    let context = '';
    if (similarEntries.length > 0) {
      context = '以下是从知识库中找到的相关信息：\n\n';
      similarEntries.forEach((entry, index) => {
        context += `${index + 1}. 问题：${entry.payload.problem}\n`;
        context += `   根本原因：${entry.payload.rootCause}\n`;
        context += `   解决方案：${entry.payload.solution}\n\n`;
      });
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

${context ? context : ''}用户的问题是：`;

    // 调用DeepSeek API
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

    res.json({ solution });
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    res.status(500).json({ error: 'Failed to generate solution' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`AI-Ops Backend Server is running on port ${PORT}`);
});