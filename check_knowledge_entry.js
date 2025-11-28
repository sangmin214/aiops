const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/aiops?authSource=admin');

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
    console.log('Root Cause:', entry.rootCause);
    console.log('Solution:', entry.solution);
    console.log('Embedding length:', entry.embedding.length);
    console.log('First 10 embedding values:', entry.embedding.slice(0, 10));
  }
  
  mongoose.connection.close();
});