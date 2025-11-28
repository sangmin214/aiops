const XLSX = require('xlsx');
const { Component, ComponentRelation } = require('./model');

/**
 * 解析Excel文件中的组件依赖数据
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
    const requiredFields = ['name', 'type', 'source', 'destination'];
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
 * 处理组件依赖数据并保存到数据库
 * @param {Array} data - 组件依赖数据
 * @returns {Object} 处理结果
 */
async function processComponentDependencies(data) {
  const results = {
    total: data.length,
    componentsCreated: 0,
    relationsCreated: 0,
    errors: []
  };

  // 用于存储已处理的组件，避免重复创建
  const processedComponents = new Map();

  try {
    // 首先处理所有组件
    for (const item of data) {
      try {
        // 处理组件名称
        const componentName = item.name.trim();
        const componentType = item.type.trim();
        
        // 检查组件是否已存在
        let component = processedComponents.get(componentName);
        if (!component) {
          component = await Component.findOne({ where: { name: componentName } });
        }
        
        // 如果组件不存在，则创建新组件
        if (!component) {
          component = await Component.create({
            name: componentName,
            type: componentType,
            description: `Imported component: ${componentName}`
          });
          results.componentsCreated++;
        }
        
        // 将组件存储到已处理的组件映射中
        processedComponents.set(componentName, component);
      } catch (error) {
        results.errors.push({
          item: item,
          error: `Failed to process component ${item.name}: ${error.message}`
        });
      }
    }

    // 然后处理所有依赖关系
    for (const item of data) {
      try {
        const sourceName = item.source.trim();
        const destinationName = item.destination.trim();
        
        // 获取源组件和目标组件
        const sourceComponent = processedComponents.get(sourceName);
        const destinationComponent = processedComponents.get(destinationName);
        
        // 如果组件不存在，尝试从数据库中查找
        if (!sourceComponent || !destinationComponent) {
          results.errors.push({
            item: item,
            error: `Component not found for relation: ${sourceName} -> ${destinationName}`
          });
          continue;
        }
        
        // 检查关系是否已存在
        const existingRelation = await ComponentRelation.findOne({
          where: {
            upstreamId: sourceComponent.id,
            downstreamId: destinationComponent.id
          }
        });
        
        // 如果关系不存在，则创建新关系
        if (!existingRelation) {
          await ComponentRelation.create({
            upstreamId: sourceComponent.id,
            downstreamId: destinationComponent.id,
            relationType: 'data_flow' // 默认关系类型
          });
          results.relationsCreated++;
        }
      } catch (error) {
        results.errors.push({
          item: item,
          error: `Failed to process relation ${item.source} -> ${item.destination}: ${error.message}`
        });
      }
    }
  } catch (error) {
    throw new Error(`Failed to process component dependencies: ${error.message}`);
  }

  return results;
}

module.exports = {
  parseExcelFile,
  processComponentDependencies
};