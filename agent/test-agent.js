const axios = require('axios');

async function testAgent() {
  try {
    // 获取所有已注册的agent
    console.log('Fetching registered agents...');
    const agentsResponse = await axios.get('http://localhost:3001/api/agent');
    console.log('Registered agents:', agentsResponse.data);
    
    if (agentsResponse.data.length === 0) {
      console.log('No agents registered');
      return;
    }
    
    const agentId = agentsResponse.data[0].id;
    console.log(`Using agent: ${agentId}`);
    
    // 向agent发送命令
    console.log('Sending command to agent...');
    const commandResponse = await axios.post(`http://localhost:3001/api/agent/${agentId}/command`, {
      command: 'ls -la'
    });
    
    console.log('Command sent:', commandResponse.data);
    
    // 等待几秒钟让命令执行完成
    console.log('Waiting for command execution...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAgent();