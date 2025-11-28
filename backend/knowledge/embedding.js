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
    
    console.log('Generated vector with length:', vector.length);
    return vector;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
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