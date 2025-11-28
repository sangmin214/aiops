const axios = require('axios');
const WebSocket = require('ws');

// 测试分布式agent的脚本
async function testDistAgent() {
  const agentId = 'dist-agent-test';
  const serverUrl = 'http://localhost:3001/api/agent';
  
  console.log('Testing Distributed Agent...');
  
  try {
    // 1. 检查agent是否注册
    console.log('1. Checking registered agents...');
    const agentsResponse = await axios.get(serverUrl);
    const agents = agentsResponse.data;
    console.log('Registered agents:', agents);
    
    // 查找我们的测试agent
    const testAgent = agents.find(agent => agent.id.includes('dist-agent'));
    if (!testAgent) {
      console.log('Test agent not found. Make sure the distributed agent is running.');
      return;
    }
    
    console.log('Found test agent:', testAgent);
    
    // 2. 向agent发送命令
    console.log('\n2. Sending command to agent...');
    const command = 'echo "Hello from distributed agent!"';
    const commandResponse = await axios.post(`${serverUrl}/${testAgent.id}/command`, {
      command: command
    });
    
    console.log('Command response:', commandResponse.data);
    
    // 3. 等待结果（通过WebSocket监听）
    console.log('\n3. Waiting for command result...');
    const ws = new WebSocket('ws://localhost:3001/');
    
    ws.on('open', function open() {
      console.log('Connected to WebSocket server for result monitoring');
    });
    
    ws.on('message', function incoming(data) {
      try {
        const message = JSON.parse(data);
        if (message.type === 'result' && message.agentId === testAgent.id) {
          console.log('Received result from agent:');
          console.log('Command:', message.command);
          console.log('Result:', message.result || message.error);
          ws.close();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', function close() {
      console.log('WebSocket connection closed');
    });
    
    // 设置超时
    setTimeout(() => {
      console.log('Test completed or timed out');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }, 10000); // 10秒后结束测试
    
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

// 运行测试
testDistAgent();