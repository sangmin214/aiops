#!/usr/bin/env node

// 分布式agent监控脚本
// 用于检查agent是否正常运行并与主服务保持连接

const axios = require('axios');
const WebSocket = require('ws');

async function monitorAgent() {
  const serverUrl = 'http://localhost:3001/api/agent';
  
  console.log('Monitoring Distributed Agents...');
  
  try {
    // 1. 检查主服务是否运行
    console.log('1. Checking main service availability...');
    const healthResponse = await axios.get('http://localhost:3001/');
    console.log('Main service is running:', healthResponse.data.message);
    
    // 2. 获取已注册的agent列表
    console.log('\n2. Fetching registered agents...');
    const agentsResponse = await axios.get(serverUrl);
    const agents = agentsResponse.data;
    
    if (!agents || agents.length === 0) {
      console.log('No agents registered with the main service.');
      return;
    }
    
    console.log(`Found ${agents.length} registered agent(s):`);
    agents.forEach((agent, index) => {
      const lastHeartbeat = agent.lastHeartbeat ? new Date(agent.lastHeartbeat) : 'Unknown';
      const timeDiff = lastHeartbeat !== 'Unknown' ? 
        Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000) : 'Unknown';
      
      console.log(`  ${index + 1}. Agent ID: ${agent.id}`);
      console.log(`     Hostname: ${agent.hostname || 'Unknown'}`);
      console.log(`     Platform: ${agent.platform || 'Unknown'} ${agent.arch || ''}`);
      console.log(`     Last Heartbeat: ${lastHeartbeat}`);
      console.log(`     Time Since Last Heartbeat: ${timeDiff !== 'Unknown' ? timeDiff + ' seconds ago' : 'Unknown'}`);
      console.log('');
    });
    
    // 3. 检查分布式agent的状态
    console.log('3. Checking distributed agents...');
    // 分布式agent可能包含'dist-agent'或使用特定命名规则
    const distAgents = agents.filter(agent => 
      agent.id.includes('dist-agent') || 
      agent.id.startsWith('agent-')
    );
    
    if (distAgents.length === 0) {
      console.log('No distributed agents found.');
      return;
    }
    
    console.log(`Found ${distAgents.length} distributed agent(s):`);
    distAgents.forEach((agent, index) => {
      const lastHeartbeat = agent.lastHeartbeat ? new Date(agent.lastHeartbeat) : 'Unknown';
      const timeDiff = lastHeartbeat !== 'Unknown' ? 
        Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000) : 'Unknown';
      
      // 判断agent是否在线（3分钟内有心跳）
      const isOnline = timeDiff !== 'Unknown' && timeDiff < 180;
      
      console.log(`  ${index + 1}. Agent ID: ${agent.id}`);
      console.log(`     Status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      console.log(`     Hostname: ${agent.hostname || 'Unknown'}`);
      console.log(`     Last Heartbeat: ${lastHeartbeat}`);
      console.log(`     Time Since Last Heartbeat: ${timeDiff !== 'Unknown' ? timeDiff + ' seconds ago' : 'Unknown'}`);
      console.log('');
    });
    
    // 4. 测试WebSocket连接
    console.log('4. Testing WebSocket connection...');
    const ws = new WebSocket('ws://localhost:3001/');
    
    ws.on('open', function open() {
      console.log('WebSocket connection established successfully');
      ws.close();
    });
    
    ws.on('error', function error(err) {
      console.error('WebSocket connection failed:', err.message);
    });
    
    ws.on('close', function close() {
      console.log('WebSocket connection test completed');
    });
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Cannot connect to main service. Make sure the service is running on port 3001.');
    } else {
      console.error('Error monitoring agents:', error.response ? error.response.data : error.message);
    }
  }
}

// 运行监控
monitorAgent();