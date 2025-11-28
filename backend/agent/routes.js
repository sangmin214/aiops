const express = require('express');
const router = express.Router();

// 导入全局registeredAgents
const { getRegisteredAgents } = require('../server');
const registeredAgents = getRegisteredAgents();

/**
 * 处理agent心跳
 * @route POST /api/agent/heartbeat
 */
router.post('/agent/heartbeat', (req, res) => {
  try {
    const agentInfo = req.body;
    
    // 更新或添加agent信息，但保留现有的websocket连接
    const existingAgent = registeredAgents[agentInfo.id];
    registeredAgents[agentInfo.id] = {
      ...agentInfo,
      websocket: existingAgent ? existingAgent.websocket : null, // 保留现有的websocket连接
      lastHeartbeat: new Date()
    };
    
    console.log(`Received heartbeat from agent ${agentInfo.id}`);
    
    res.json({ 
      message: 'Heartbeat received successfully',
      agentId: agentInfo.id
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

/**
 * 处理agent执行结果
 * @route POST /api/agent/result
 */
router.post('/agent/result', (req, res) => {
  try {
    const { agentId, command, result } = req.body;
    
    // 记录结果
    console.log(`Received result from agent ${agentId} for command: ${command}`);
    console.log('Result:', result);
    
    // 这里可以将结果存储到数据库或进行其他处理
    // 为了演示，我们只是打印到控制台
    
    res.json({ 
      message: 'Result received successfully',
      agentId,
      command
    });
  } catch (error) {
    console.error('Error processing result:', error);
    res.status(500).json({ error: 'Failed to process result' });
  }
});

/**
 * 获取所有已注册的agent
 * @route GET /api/agent
 */
router.get('/agent', (req, res) => {
  try {
    const agents = Object.values(registeredAgents);
    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * 向指定agent发送命令
 * @route POST /api/agent/:agentId/command
 */
router.post('/agent/:agentId/command', (req, res) => {
  try {
    const { agentId } = req.params;
    const { command } = req.body;
    
    // 检查agent是否存在
    const agent = registeredAgents[agentId];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    console.log('Registered agents:', Object.keys(registeredAgents));
    console.log('Agent info:', agent);
    
    // 通过WebSocket发送命令
    if (agent.websocket && agent.websocket.readyState === 1) { // 1 = OPEN
      agent.websocket.send(JSON.stringify({
        type: 'command',
        command: command
      }));
      
      console.log(`Command sent to agent ${agentId} via WebSocket: ${command}`);
      
      res.json({ 
        message: 'Command sent to agent via WebSocket',
        agentId,
        command
      });
    } else {
      console.log(`WebSocket not ready for agent ${agentId}. Ready state: ${agent.websocket ? agent.websocket.readyState : 'no websocket'}`);
      // 如果WebSocket不可用，返回错误
      res.status(503).json({ 
        error: 'Agent is not connected via WebSocket',
        agentId,
        command
      });
    }
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// 导出registeredAgents以便其他模块可以访问
module.exports = router;
module.exports.registeredAgents = registeredAgents;