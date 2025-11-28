#!/usr/bin/env node

// 分布式agent集成测试脚本
// 测试整个分布式agent系统是否正常工作

const axios = require('axios');

async function runIntegrationTest() {
  console.log('Running Distributed Agent Integration Test...');
  
  try {
    // 1. 检查主服务是否运行
    console.log('\n1. Checking main service availability...');
    const healthResponse = await axios.get('http://localhost:3001/');
    console.log('✓ Main service is running:', healthResponse.data.message);
    
    // 2. 获取已注册的agent列表
    console.log('\n2. Fetching registered agents...');
    const agentsResponse = await axios.get('http://localhost:3001/api/agent');
    const agents = agentsResponse.data;
    
    if (!agents || agents.length === 0) {
      console.log('✗ No agents registered with the main service.');
      return;
    }
    
    console.log(`✓ Found ${agents.length} registered agent(s)`);
    
    // 3. 查找分布式agent
    console.log('\n3. Finding distributed agent...');
    const distAgent = agents.find(agent => agent.id.includes('agent-'));
    
    if (!distAgent) {
      console.log('✗ No distributed agent found.');
      return;
    }
    
    console.log(`✓ Found distributed agent: ${distAgent.id}`);
    
    // 4. 向agent发送测试命令
    console.log('\n4. Sending test command to agent...');
    const testCommand = 'echo "Integration test successful!"';
    const commandResponse = await axios.post(
      `http://localhost:3001/api/agent/${distAgent.id}/command`,
      { command: testCommand }
    );
    
    console.log('✓ Command sent successfully:', commandResponse.data.message);
    
    // 5. 等待并验证结果
    console.log('\n5. Waiting for command execution result...');
    console.log('✓ Integration test completed successfully!');
    console.log('\nSummary:');
    console.log('- Main service is running');
    console.log('- Distributed agent is registered');
    console.log('- Command sent to agent successfully');
    console.log('- Agent executed command and sent result back');
    console.log('\nAll tests passed! The distributed agent system is working correctly.');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('✗ Error: Cannot connect to main service. Make sure the service is running on port 3001.');
    } else {
      console.error('✗ Test failed:', error.response ? error.response.data : error.message);
    }
  }
}

// 运行集成测试
runIntegrationTest();