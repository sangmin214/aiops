const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config({ path: './backend/.env' });

// 初始化Qdrant客户端
const client = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: process.env.QDRANT_PORT || 6433,
  https: false,
});

const COLLECTION_NAME = 'knowledge_base';

async function testVectorSearch() {
  try {
    // 生成查询文本的向量嵌入
    const { generateEmbedding } = require('./backend/knowledge/embedding');
    
    const queryText = "flowmanager.exe无法处理消息，怎么办";
    console.log("Generating embedding for query:", queryText);
    
    const queryVector = await generateEmbedding(queryText);
    console.log("Query vector length:", queryVector.length);
    console.log("First 10 values:", queryVector.slice(0, 10));
    
    // 搜索相似条目
    console.log("\nSearching for similar entries...");
    const searchParams = {
      vector: queryVector,
      limit: 10,
      with_payload: true,
    };
    
    console.log("Search params:", JSON.stringify(searchParams, null, 2));
    
    const result = await client.search(COLLECTION_NAME, searchParams);
    
    console.log("\nSearch result count:", result.length);
    console.log("Search results:");
    result.forEach((entry, index) => {
      console.log(`  ${index + 1}. Score: ${entry.score}, Problem: ${entry.payload.problem}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testVectorSearch();