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
    // 逐条处理每条记录，确保每条记录独立处理，不提前扫描所有记录
    for (const item of data) {
      try {
        const componentName = item.name.trim();
        const componentType = item.type.trim();
        const sourceName = item.source.trim();
        const destinationName = item.destination.trim();
        
        // 处理主组件（name字段）
        let mainComponent = processedComponents.get(componentName);
        if (!mainComponent) {
          mainComponent = await Component.findOne({ where: { name: componentName } });
          if (!mainComponent) {
            // 创建主组件
            mainComponent = await Component.create({
              name: componentName,
              type: componentType,
              description: `Imported component: ${componentName}`
            });
            results.componentsCreated++;
          }
          processedComponents.set(componentName, mainComponent);
        } else if (mainComponent.type === 'unknown' && componentType !== 'unknown') {
          // 如果组件已存在但类型是unknown，更新类型
          await mainComponent.update({ type: componentType });
        }
        
        // 处理源组件（source字段）
        let sourceComponent = processedComponents.get(sourceName);
        if (!sourceComponent) {
          sourceComponent = await Component.findOne({ where: { name: sourceName } });
          if (!sourceComponent) {
            // 创建源组件
            sourceComponent = await Component.create({
              name: sourceName,
              type: 'unknown',
              description: `Auto-created component: ${sourceName}`
            });
            results.componentsCreated++;
          }
          processedComponents.set(sourceName, sourceComponent);
        }
        
        // 处理目标组件（destination字段）
        let destinationComponent = processedComponents.get(destinationName);
        if (!destinationComponent) {
          destinationComponent = await Component.findOne({ where: { name: destinationName } });
          if (!destinationComponent) {
            // 创建目标组件
            destinationComponent = await Component.create({
              name: destinationName,
              type: 'unknown',
              description: `Auto-created component: ${destinationName}`
            });
            results.componentsCreated++;
          }
          processedComponents.set(destinationName, destinationComponent);
        }
        
        // 为主组件建立上游依赖关系（source -> name）
        if (sourceName && sourceName !== componentName) {
          const existingUpstreamRelation = await ComponentRelation.findOne({
            where: {
              upstreamId: sourceComponent.id,
              downstreamId: mainComponent.id
            }
          });
          
          if (!existingUpstreamRelation) {
            await ComponentRelation.create({
              upstreamId: sourceComponent.id,
              downstreamId: mainComponent.id,
              relationType: 'data_flow'
            });
            results.relationsCreated++;
          }
        }
        
        // 为主组件建立下游依赖关系（name -> destination）
        if (destinationName && destinationName !== componentName) {
          const existingDownstreamRelation = await ComponentRelation.findOne({
            where: {
              upstreamId: mainComponent.id,
              downstreamId: destinationComponent.id
            }
          });
          
          if (!existingDownstreamRelation) {
            await ComponentRelation.create({
              upstreamId: mainComponent.id,
              downstreamId: destinationComponent.id,
              relationType: 'data_flow'
            });
            results.relationsCreated++;
          }
        }
      } catch (error) {
        results.errors.push({
          item: item,
          error: `Failed to process item: ${error.message}`
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