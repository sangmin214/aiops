const mongoose = require('mongoose');
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config({ path: './backend/.env' });

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/aiops?authSource=admin');

// 初始化Qdrant客户端
const qdrantClient = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: process.env.QDRANT_PORT || 6433,
  https: false,
});

const COLLECTION_NAME = 'knowledge_base';

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  // 定义知识库条目模型
  const KnowledgeEntrySchema = new mongoose.Schema({
    problem: {
      type: String,
      required: true,
      trim: true
    },
    rootCause: {
      type: String,
      required: true,
      trim: true
    },
    solution: {
      type: String,
      required: true,
      trim: true
    },
    embedding: {
      type: [Number],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const KnowledgeEntry = mongoose.model('KnowledgeEntry', KnowledgeEntrySchema);
  
  // 查找包含flowmanager的条目
  const entries = await KnowledgeEntry.find({
    problem: { $regex: /flowmanager/i }
  });
  
  console.log(`Found ${entries.length} entries with 'flowmanager' in problem:`);
  
  for (const entry of entries) {
    console.log('\n--- Entry ---');
    console.log('ID:', entry._id);
    console.log('Problem:', entry.problem);
    
    // 重新生成向量嵌入
    const { generateKnowledgeEmbedding } = require('./backend/knowledge/embedding');
    const newEmbedding = await generateKnowledgeEmbedding(entry);
    
    console.log('Old embedding length:', entry.embedding.length);
    console.log('New embedding length:', newEmbedding.length);
    
    // 更新MongoDB中的条目
    entry.embedding = newEmbedding;
    await entry.save();
    console.log('Updated MongoDB entry');
    
    // 更新Qdrant中的条目
    try {
      // 使用ObjectId的哈希值作为Qdrant的ID
      const qdrantId = Math.abs(entry._id.toString().split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)) % 1000000000;
      
      const upsertRequest = {
        points: [{
          id: qdrantId,
          vector: newEmbedding,
          payload: {
            problem: entry.problem,
            rootCause: entry.rootCause,
            solution: entry.solution,
            createdAt: entry.createdAt
          }
        }]
      };
      
      await qdrantClient.upsert(COLLECTION_NAME, upsertRequest);
      console.log('Updated Qdrant entry');
    } catch (error) {
      console.error('Error updating Qdrant entry:', error);
    }
  }
  
  mongoose.connection.close();
});