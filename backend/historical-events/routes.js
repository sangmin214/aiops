const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseExcelFile, summarizeEvent, addEventToKnowledgeBase } = require('./excelProcessor');

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
        await addEventToKnowledgeBase(summarizedData);
        console.log(`Added event ${eventData.TicketNum} to knowledge base`);
        
        results.success++;
      } catch (error) {
        console.error(`Failed to process event ${eventData.TicketNum}:`, error);
        results.failed++;
        results.errors.push({
          ticketNum: eventData.TicketNum,
          error: error.message
        });
      }
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
router.get('/historical-events/import-history', (req, res) => {
  // 这里可以实现获取导入历史记录的功能
  // 目前返回空数组作为占位符
  res.json([]);
});

module.exports = router;