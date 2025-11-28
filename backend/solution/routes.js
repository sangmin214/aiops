const express = require('express');
const router = express.Router();
const Solution = require('./model');

/**
 * 创建新的解决方案
 * @route POST /api/solutions
 */
router.post('/solutions', async (req, res) => {
  try {
    const { title, content, problem, tags, isExecutable, executableScript, source } = req.body;
    
    // 验证必需字段
    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields: title, content'
      });
    }
    
    console.log('Creating new solution:', { title, content });
    
    // 创建解决方案
    const solution = await Solution.create({
      title,
      content,
      problem,
      tags: tags || [],
      isExecutable: isExecutable || false,
      executableScript,
      source
    });
    
    res.status(201).json({
      message: 'Solution created successfully',
      solution
    });
  } catch (error) {
    console.error('Error creating solution:', error);
    res.status(500).json({ error: 'Failed to create solution' });
  }
});

/**
 * 获取所有解决方案
 * @route GET /api/solutions
 */
router.get('/solutions', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tag } = req.query;
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    const where = {};
    if (search) {
      where[Sequelize.Op.or] = [
        { title: { [Sequelize.Op.iLike]: `%${search}%` } },
        { content: { [Sequelize.Op.iLike]: `%${search}%` } },
        { problem: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    // 构建标签查询条件
    const include = [];
    if (tag) {
      where.tags = {
        [Sequelize.Op.contains]: [tag]
      };
    }
    
    const solutions = await Solution.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      solutions: solutions.rows,
      total: solutions.count,
      page: parseInt(page),
      totalPages: Math.ceil(solutions.count / limit)
    });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    res.status(500).json({ error: 'Failed to fetch solutions' });
  }
});

/**
 * 根据ID获取解决方案
 * @route GET /api/solutions/:id
 */
router.get('/solutions/:id', async (req, res) => {
  try {
    const solution = await Solution.findByPk(req.params.id);
    if (!solution) {
      return res.status(404).json({ error: 'Solution not found' });
    }
    res.json(solution);
  } catch (error) {
    console.error('Error fetching solution:', error);
    res.status(500).json({ error: 'Failed to fetch solution' });
  }
});

/**
 * 更新解决方案
 * @route PUT /api/solutions/:id
 */
router.put('/solutions/:id', async (req, res) => {
  try {
    const solution = await Solution.findByPk(req.params.id);
    if (!solution) {
      return res.status(404).json({ error: 'Solution not found' });
    }
    
    const { title, content, problem, tags, isExecutable, executableScript } = req.body;
    
    // 更新字段
    solution.title = title || solution.title;
    solution.content = content || solution.content;
    solution.problem = problem || solution.problem;
    solution.tags = tags || solution.tags;
    solution.isExecutable = isExecutable !== undefined ? isExecutable : solution.isExecutable;
    solution.executableScript = executableScript || solution.executableScript;
    solution.version = solution.version + 1;
    
    await solution.save();
    
    res.json({
      message: 'Solution updated successfully',
      solution
    });
  } catch (error) {
    console.error('Error updating solution:', error);
    res.status(500).json({ error: 'Failed to update solution' });
  }
});

/**
 * 删除解决方案
 * @route DELETE /api/solutions/:id
 */
router.delete('/solutions/:id', async (req, res) => {
  try {
    const solution = await Solution.findByPk(req.params.id);
    if (!solution) {
      return res.status(404).json({ error: 'Solution not found' });
    }
    
    await solution.destroy();
    
    res.json({ message: 'Solution deleted successfully' });
  } catch (error) {
    console.error('Error deleting solution:', error);
    res.status(500).json({ error: 'Failed to delete solution' });
  }
});

/**
 * 执行解决方案脚本
 * @route POST /api/solutions/:id/execute
 */
router.post('/solutions/:id/execute', async (req, res) => {
  try {
    const solution = await Solution.findByPk(req.params.id);
    if (!solution) {
      return res.status(404).json({ error: 'Solution not found' });
    }
    
    if (!solution.isExecutable) {
      return res.status(400).json({ error: 'Solution is not executable' });
    }
    
    if (!solution.executableScript) {
      return res.status(400).json({ error: 'No executable script found' });
    }
    
    // 获取已注册的agents
    const { registeredAgents } = require('../server');
      
    // 查找一个在线的agent来执行脚本
    let targetAgent = null;
    let targetAgentId = null;
      
    for (const [agentId, agent] of Object.entries(registeredAgents)) {
      // 检查agent是否在线（3分钟内有心跳）
      if (agent.lastHeartbeat && (new Date() - new Date(agent.lastHeartbeat)) < 180000) {
        targetAgent = agent;
        targetAgentId = agentId;
        break;
      }
    }
      
    if (!targetAgent) {
      return res.status(400).json({ error: 'No online agent available to execute the script' });
    }
      
    // 通过WebSocket发送命令到agent
    if (targetAgent.websocket && targetAgent.websocket.readyState === 1) { // 1 = OPEN
      targetAgent.websocket.send(JSON.stringify({
        type: 'command',
        command: solution.executableScript
      }));
        
      console.log(`Script sent to agent ${targetAgentId} for execution: ${solution.executableScript}`);
        
      res.json({
        message: 'Script execution started',
        solutionId: solution.id,
        agentId: targetAgentId,
        script: solution.executableScript,
        status: 'sent'
      });
    } else {
      console.log(`WebSocket not ready for agent ${targetAgentId}. Ready state: ${targetAgent.websocket ? targetAgent.websocket.readyState : 'no websocket'}`);
      return res.status(503).json({ 
        error: 'Agent is not connected via WebSocket',
        agentId: targetAgentId
      });
    }
  } catch (error) {
    console.error('Error executing solution:', error);
    res.status(500).json({ error: 'Failed to execute solution' });
  }
});

module.exports = router;