const XLSX = require('xlsx');
const OpenAI = require('openai');
const mongoose = require('mongoose');
const KnowledgeEntry = require('../knowledge/models');
const { generateKnowledgeEmbedding } = require('../knowledge/embedding');
const { addKnowledgeEntry } = require('../knowledge/qdrant');

// 初始化DeepSeek客户端
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1"
});

/**
 * 读取Excel文件并解析数据
 * @param {Buffer} fileBuffer - Excel文件的Buffer
 * @returns {Array} 解析后的数据数组
 */
function parseExcelFile(fileBuffer) {
  try {
    // 读取Excel文件
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 将工作表转换为JSON格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // 验证必要的字段是否存在
    const requiredFields = ['TicketNum', 'Description', 'RootCause', 'Resolution'];
    const parsedData = jsonData.map(row => {
      const parsedRow = {};
      
      // 映射字段，处理大小写不一致的情况
      for (const field of requiredFields) {
        // 查找可能的字段名（包括大小写变体）
        const possibleFieldNames = [
          field,
          field.toLowerCase(),
          field.toUpperCase(),
          field.charAt(0).toUpperCase() + field.slice(1).toLowerCase()
        ];
        
        let foundValue = null;
        for (const fieldName of possibleFieldNames) {
          if (row[fieldName] !== undefined) {
            foundValue = row[fieldName];
            break;
          }
        }
        
        if (foundValue === null) {
          throw new Error(`Missing required field: ${field}`);
        }
        
        parsedRow[field] = foundValue;
      }
      
      return parsedRow;
    });
    
    return parsedData;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * 使用AI模型总结历史事件信息
 * @param {Object} eventData - 历史事件数据
 * @returns {Object} 总结后的数据
 */
async function summarizeEvent(eventData) {
  try {
    // 构建发送给AI的提示词
    const prompt = `请根据以下历史事件信息，提取关键问题描述、根本原因和解决方案：
    
工单号: ${eventData.TicketNum}
问题描述: ${eventData.Description}
根本原因: ${eventData.RootCause}
解决方案: ${eventData.Resolution}

请按照以下格式输出结果：
问题: [简洁的问题描述]
根本原因: [精炼的根本原因说明]
解决方案: [清晰的解决方案步骤]

注意:
1. 保持语言简洁明了
2. 重点突出问题的核心要点
3. 如果解决方案包含多个步骤，请使用编号列出
4. 不要添加任何额外的解释或说明`;

    // 调用DeepSeek API进行总结
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "你是一个专业的IT运维专家，擅长从历史事件中提取关键信息并形成标准化的知识条目。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content;
    
    // 解析AI返回的总结内容
    const lines = summary.split('\n').filter(line => line.trim() !== '');
    let problem = '';
    let rootCause = '';
    let solution = '';
    
    for (const line of lines) {
      if (line.startsWith('问题:')) {
        problem = line.replace('问题:', '').trim();
      } else if (line.startsWith('根本原因:')) {
        rootCause = line.replace('根本原因:', '').trim();
      } else if (line.startsWith('解决方案:')) {
        solution = line.replace('解决方案:', '').trim();
      }
    }
    
    // 如果AI没有按预期格式输出，使用原始数据
    if (!problem || !rootCause || !solution) {
      problem = eventData.Description;
      rootCause = eventData.RootCause;
      solution = eventData.Resolution;
    }
    
    return {
      problem,
      rootCause,
      solution,
      ticketNum: eventData.TicketNum
    };
  } catch (error) {
    console.error('Error summarizing event:', error);
    // 如果AI总结失败，使用原始数据
    return {
      problem: eventData.Description,
      rootCause: eventData.RootCause,
      solution: eventData.Resolution,
      ticketNum: eventData.TicketNum
    };
  }
}

/**
 * 将总结后的事件数据添加到知识库
 * @param {Object} summarizedData - 总结后的事件数据
 * @returns {Object} 保存的知识库条目
 */
async function addEventToKnowledgeBase(summarizedData) {
  try {
    // 创建知识库条目
    const knowledgeEntry = new KnowledgeEntry({
      problem: summarizedData.problem,
      rootCause: summarizedData.rootCause,
      solution: summarizedData.solution,
      source: `Historical Event (${summarizedData.ticketNum})`
    });
    
    // 生成向量嵌入
    const embedding = await generateKnowledgeEmbedding(knowledgeEntry);
    knowledgeEntry.embedding = embedding;
    
    // 保存到MongoDB
    const savedEntry = await knowledgeEntry.save();
    console.log('Knowledge entry saved to MongoDB:', savedEntry._id);
    
    // 添加到向量数据库
    await addKnowledgeEntry(savedEntry._id.toString(), embedding, {
      problem: savedEntry.problem,
      rootCause: savedEntry.rootCause,
      solution: savedEntry.solution,
      createdAt: savedEntry.createdAt
    });
    console.log('Knowledge entry added to Qdrant vector database');
    
    return savedEntry;
  } catch (error) {
    console.error('Error adding event to knowledge base:', error);
    throw error;
  }
}

module.exports = {
  parseExcelFile,
  summarizeEvent,
  addEventToKnowledgeBase
};