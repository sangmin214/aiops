const { OpenAI } = require('openai');

// 初始化DeepSeek客户端用于生成嵌入
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,
});

/**
 * 生成文本的向量嵌入
 * @param {string} text - 要生成嵌入的文本
 * @returns {Promise<Array<number>>} 文本的向量嵌入
 */
async function generateEmbedding(text) {
  try {
    console.log('Generating embedding for text:', text.substring(0, 50) + '...');
    
    // 使用DeepSeek API生成真实的文本嵌入
    const response = await deepseek.embeddings.create({
      model: "text-embedding-3-small", // 使用DeepSeek支持的嵌入模型
      input: text,
      encoding_format: "float"
    });
    
    const embedding = response.data[0].embedding;
    console.log('Generated embedding with length:', embedding.length);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding with DeepSeek API:', error);
    // 如果API调用失败，回退到旧的哈希方法
    console.log('Falling back to hash-based embedding generation');
    
    // 使用更复杂的哈希方法生成向量表示
    // 确保生成的向量长度为1536
    const vector = new Array(1536).fill(0);
    
    // 将文本转换为更均匀分布的向量
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = charCode % 1536;
      // 使用字符频率和位置信息来增加向量的区分度
      vector[index] += (charCode * (i + 1)) / 10000;
    }
    
    // 归一化向量以提高相似度计算的准确性
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }
    
    console.log('Generated fallback vector with length:', vector.length);
    return vector;
  }
}

/**
 * 生成知识库条目的完整嵌入（结合问题、根本原因和解决方案）
 * @param {Object} knowledgeEntry - 知识库条目对象
 * @returns {Promise<Array<number>>} 条目的向量嵌入
 */
async function generateKnowledgeEmbedding(knowledgeEntry) {
  const fullText = `${knowledgeEntry.problem} ${knowledgeEntry.rootCause} ${knowledgeEntry.solution}`;
  return await generateEmbedding(fullText);
}

module.exports = {
  generateEmbedding,
  generateKnowledgeEmbedding
};