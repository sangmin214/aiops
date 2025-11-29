/**
 * 解析Markdown文档并提取SOP信息
 * @param {Buffer} fileBuffer - Markdown文档的Buffer
 * @returns {Object} 解析后的SOP信息
 */
function parseMarkdownDocument(fileBuffer) {
  try {
    // 将Buffer转换为字符串
    const textContent = fileBuffer.toString('utf-8');
    
    // 引入SOP信息提取函数
    const { extractSOPInfo } = require('./sopExtractor');
    
    // 提取SOP信息
    const sopInfo = extractSOPInfo(textContent);
    
    return sopInfo;
  } catch (error) {
    throw new Error(`Failed to parse Markdown document: ${error.message}`);
  }
}

module.exports = {
  parseMarkdownDocument
};