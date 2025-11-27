const { QdrantClient } = require('@qdrant/js-client-rest');

// 初始化Qdrant客户端，禁用版本检查
const client = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: process.env.QDRANT_PORT || 6433,
  https: false,
  checkCompatibility: false, // 禁用版本兼容性检查
});

const COLLECTION_NAME = 'knowledge_base';

/**
 * 初始化向量数据库集合
 */
async function initCollection() {
  try {
    // 检查集合是否已存在
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );
    
    if (!collectionExists) {
      // 创建新的集合，使用明确的配置
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
      console.log(`Collection '${COLLECTION_NAME}' created successfully`);
    } else {
      console.log(`Collection '${COLLECTION_NAME}' already exists`);
      // 删除现有的集合并重新创建以确保配置正确
      await client.deleteCollection(COLLECTION_NAME);
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });
      console.log(`Collection '${COLLECTION_NAME}' recreated successfully`);
    }
  } catch (error) {
    console.error('Error initializing collection:', error);
    throw error;
  }
}

/**
 * 将知识库条目添加到向量数据库
 * @param {string} id - 条目ID
 * @param {Array<number>} vector - 向量嵌入
 * @param {Object} payload - 条目元数据
 */
async function addKnowledgeEntry(id, vector, payload) {
  try {
    // 确保ID是有效的格式（数字或UUID）
    let formattedId;
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      // 如果ID是数字字符串，转换为数字
      formattedId = parseInt(id, 10);
    } else if (typeof id === 'string' && /^[0-9a-f]{24}$/.test(id)) {
      // 如果ID是MongoDB ObjectId格式，转换为数字（取前几个字符）
      // 或者生成一个唯一的数字ID
      formattedId = Math.abs(id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)) % 1000000000;
    } else if (typeof id === 'string') {
      // 如果ID是普通字符串，生成一个基于字符串的数字ID
      formattedId = Math.abs(id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)) % 1000000000;
    } else {
      // 其他情况，转换为字符串并生成数字ID
      formattedId = Math.abs(String(id).split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)) % 1000000000;
    }
    
    // 验证向量数据
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Invalid vector data: must be a non-empty array');
    }
    
    // 验证向量维度
    if (vector.length !== 1536) {
      console.warn(`Warning: Vector dimension mismatch. Expected 1536, got ${vector.length}`);
      // 如果维度不匹配，截断或填充到正确大小
      if (vector.length > 1536) {
        vector = vector.slice(0, 1536);
      } else {
        vector = [...vector, ...Array(1536 - vector.length).fill(0)];
      }
    }
    
    // 验证payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: must be an object');
    }
    
    // 确保payload中的值是字符串或数字
    const cleanPayload = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleanPayload[key] = value;
      } else if (value instanceof Date) {
        cleanPayload[key] = value.toISOString();
      } else {
        cleanPayload[key] = String(value);
      }
    }
    
    console.log('Adding point to Qdrant:', {
      originalId: id,
      formattedId: formattedId,
      idType: typeof formattedId,
      vectorLength: vector.length,
      payloadKeys: Object.keys(cleanPayload)
    });
    
    // 使用更明确的调用方式
    const upsertRequest = {
      points: [{
        id: formattedId,
        vector: vector,
        payload: cleanPayload
      }]
    };
    
    console.log('Upsert request structure:', JSON.stringify(upsertRequest, null, 2));
    
    // 尝试不使用wait参数的调用方式
    const result = await client.upsert(COLLECTION_NAME, upsertRequest);
    
    console.log(`Knowledge entry ${formattedId} added successfully`, result);
  } catch (error) {
    console.error('Error adding knowledge entry:', error);
    throw error;
  }
}

/**
 * 搜索相似的知识库条目
 * @param {Array<number>} queryVector - 查询向量
 * @param {number} limit - 返回结果数量限制
 * @returns {Promise<Array>} 相似的条目列表
 */
async function searchSimilarEntries(queryVector, limit = 5) {
  try {
    const result = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: limit,
      with_payload: true,
    });
    
    return result;
  } catch (error) {
    console.error('Error searching similar entries:', error);
    throw error;
  }
}

module.exports = {
  initCollection,
  addKnowledgeEntry,
  searchSimilarEntries,
};