const mammoth = require('mammoth');
const { extractSOPInfo } = require('./sopExtractor');

/**
 * 解析Word文档并提取SOP信息
 * @param {Buffer} fileBuffer - Word文档的Buffer
 * @returns {Object} 解析后的SOP信息
 */
async function parseWordDocument(fileBuffer) {
  try {
    // 使用mammoth解析Word文档
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const textContent = result.value; // 文档的纯文本内容
    
    // 提取SOP信息
    const sopInfo = extractSOPInfo(textContent);
    
    return sopInfo;
  } catch (error) {
    throw new Error(`Failed to parse Word document: ${error.message}`);
  }
}

module.exports = {
  parseWordDocument
};