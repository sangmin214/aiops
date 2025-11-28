const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { parseExcelFile, summarizeEvent, addEventToKnowledgeBase } = require('./excelProcessor');

// 导入历史记录文件路径
const IMPORT_HISTORY_FILE = path.join(__dirname, 'import_history.json');

// 配置multer用于处理文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    if (file.mimetype.includes('spreadsheetml') || 
        file.mimetype.includes('excel') || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件 (.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

/**
 * 导入历史事件Excel文件
 * @route POST /api/historical-events/import
 */
router.post('/historical-events/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    console.log('Processing Excel file import...');
    
    // 解析Excel文件
    const eventsData = parseExcelFile(req.file.buffer);
    console.log(`Parsed ${eventsData.length} events from Excel file`);
    
    // 存储处理结果
    const results = {
      total: eventsData.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    };
    
    // 处理每个事件
    for (const [index, eventData] of eventsData.entries()) {
      try {
        console.log(`Processing event ${index + 1}/${eventsData.length}: ${eventData.TicketNum}`);
        
        // 使用AI总结事件信息
        const summarizedData = await summarizeEvent(eventData);
        console.log(`Summarized event ${eventData.TicketNum}`);
        
        // 将总结后的信息插入知识库
        const result = await addEventToKnowledgeBase(summarizedData);
        console.log(`Processed event ${eventData.TicketNum} for knowledge base`);
        
        // 检查是否为重复事件
        if (result.isDuplicate) {
          results.duplicates++;
          console.log(`Skipped duplicate event ${eventData.TicketNum}`);
        } else {
          results.success++;
          console.log(`Added new event ${eventData.TicketNum} to knowledge base`);
        }
      } catch (error) {
        console.error(`Failed to process event ${eventData.TicketNum}:`, error);
        results.failed++;
        results.errors.push({
          ticketNum: eventData.TicketNum,
          error: error.message
        });
      }
    }
    
    // 记录导入历史
    try {
      // 读取现有的导入历史
      let importHistory = [];
      try {
        const data = await fs.readFile(IMPORT_HISTORY_FILE, 'utf8');
        importHistory = JSON.parse(data);
      } catch (error) {
        // 如果文件不存在或解析失败，使用空数组
        importHistory = [];
      }
      
      // 添加新的导入记录
      importHistory.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        fileName: req.file.originalname,
        fileSize: req.file.size,
        total: results.total,
        success: results.success,
        failed: results.failed,
        duplicates: results.duplicates
      });
      
      // 保存到文件
      await fs.writeFile(IMPORT_HISTORY_FILE, JSON.stringify(importHistory, null, 2));
    } catch (historyError) {
      console.error('Failed to save import history:', historyError);
    }
    
    res.json({
      message: '历史事件导入完成',
      results
    });
  } catch (error) {
    console.error('Error importing historical events:', error);
    res.status(500).json({ error: `导入历史事件失败: ${error.message}` });
  }
});

/**
 * 获取导入历史记录
 * @route GET /api/historical-events/import-history
 */
router.get('/historical-events/import-history', async (req, res) => {
  try {
    // 读取导入历史记录文件
    let history = [];
    try {
      const data = await fs.readFile(IMPORT_HISTORY_FILE, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      // 如果文件不存在或解析失败，返回空数组
      history = [];
    }
    
    // 按时间倒序排列
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(history);
  } catch (error) {
    console.error('Error reading import history:', error);
    res.status(500).json({ error: 'Failed to read import history' });
  }
});

/**
 * 获取导入统计信息
 * @route GET /api/historical-events/statistics
 */
router.get('/historical-events/statistics', async (req, res) => {
  try {
    // 读取导入历史记录文件
    let history = [];
    try {
      const data = await fs.readFile(IMPORT_HISTORY_FILE, 'utf8');
      history = JSON.parse(data);
    } catch (error) {
      // 如果文件不存在或解析失败，返回空数组
      history = [];
    }
    
    // 计算统计信息
    const totalImports = history.length;
    const totalSuccess = history.reduce((sum, record) => sum + record.success, 0);
    const totalFailed = history.reduce((sum, record) => sum + record.failed, 0);
    const totalDuplicates = history.reduce((sum, record) => sum + (record.duplicates || 0), 0);
    const totalRecords = history.reduce((sum, record) => sum + record.total, 0);
    
    // 按日期分组统计
    const dailyStats = {};
    history.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { imports: 0, success: 0, failed: 0, records: 0 };
      }
      dailyStats[date].imports++;
      dailyStats[date].success += record.success;
      dailyStats[date].failed += record.failed;
      dailyStats[date].records += record.total;
    });
    
    // 获取最近7天的数据
    const recentDays = Object.keys(dailyStats)
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 7)
      .reverse();
    
    const recentStats = recentDays.map(date => ({
      date,
      ...dailyStats[date]
    }));
    
    res.json({
      totalImports,
      totalSuccess,
      totalFailed,
      totalDuplicates,
      totalRecords,
      successRate: totalRecords > 0 ? ((totalSuccess / totalRecords) * 100).toFixed(2) : '0.00',
      recentStats
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;