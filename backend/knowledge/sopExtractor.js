/**
 * 从文本内容中提取SOP信息
 * @param {string} textContent - 文本内容
 * @returns {Object} 提取的SOP信息
 */
function extractSOPInfo(textContent) {
  // 移除多余的空白字符和换行符
  const cleanedText = textContent.replace(/\s+/g, ' ').trim();
  
  // 默认值
  let problem = 'SOP文档导入';
  let rootCause = '标准操作程序';
  let solution = cleanedText;
  
  // 尝试从文本中提取标题作为问题描述
  const titleMatch = cleanedText.match(/^(.*?)\s*[：:]/);
  if (titleMatch && titleMatch[1]) {
    problem = titleMatch[1].trim();
  }
  
  // 尝试提取关键部分作为根本原因
  const causeIndicators = ['目的', '概述', '简介', '背景'];
  for (const indicator of causeIndicators) {
    const regex = new RegExp(`${indicator}[：:]?(.*?)(?=\\s+[A-Z]|$)`, 'i');
    const match = cleanedText.match(regex);
    if (match && match[1]) {
      rootCause = match[1].trim();
      break;
    }
  }
  
  // 如果文本很长，可能需要截断以适应数据库字段限制
  if (solution.length > 10000) {
    solution = solution.substring(0, 10000) + '... (内容已截断)';
  }
  
  return {
    problem,
    rootCause,
    solution
  };
}

module.exports = {
  extractSOPInfo
};