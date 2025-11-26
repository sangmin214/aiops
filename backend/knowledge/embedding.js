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
    // 使用简单的哈希方法生成向量表示
    // 确保生成的向量长度为1536
    const vector = [];
    const len = Math.min(text.length, 1536);
    
    for (let i = 0; i < 1536; i++) {
      if (i < len) {
        // 使用字符的ASCII值作为向量元素
        vector.push(text.charCodeAt(i) / 255.0);
      } else {
        // 对于较短的文本，用0填充
        vector.push(0);
      }
    }
    
    // 确保向量长度正确
    if (vector.length !== 1536) {
      throw new Error(`Generated vector has incorrect length: ${vector.length}`);
    }
    
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