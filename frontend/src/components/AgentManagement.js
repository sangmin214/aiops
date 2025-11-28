import React, { useState, useEffect } from 'react';

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [command, setCommand] = useState('');
  const [commandResult, setCommandResult] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);

  // 获取所有已注册的agent
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/agent', {
        credentials: 'include' // 包含凭证信息
      });
      const data = await response.json();
      if (response.ok) {
        setAgents(data);
      }
    } catch (error) {
      console.error('获取agent列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取命令执行历史
  const fetchCommandHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/agent/results', {
        credentials: 'include' // 包含凭证信息
      });
      const data = await response.json();
      if (response.ok) {
        setCommandHistory(data);
      }
    } catch (error) {
      console.error('获取命令执行历史失败:', error);
    }
  };

  // 发送命令到指定agent
  const sendCommandToAgent = async (agentId, command) => {
    try {
      setLoading(true);
      setCommandResult('');
      
      const response = await fetch(`http://localhost:3001/api/agent/${agentId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
        credentials: 'include' // 包含凭证信息
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCommandResult(`命令已发送到agent ${agentId}: ${data.message}`);
        // 发送命令后刷新历史记录
        setTimeout(fetchCommandHistory, 1000);
      } else {
        setCommandResult(`发送命令失败: ${data.error}`);
      }
    } catch (error) {
      setCommandResult(`网络错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 清除命令历史
  const clearCommandHistory = async () => {
    if (window.confirm('确定要清除所有命令执行历史吗？')) {
      try {
        const response = await fetch('http://localhost:3001/api/agent/results', {
          method: 'DELETE',
          credentials: 'include' // 包含凭证信息
        });
        
        if (response.ok) {
          setCommandHistory([]);
        }
      } catch (error) {
        console.error('清除命令历史失败:', error);
      }
    }
  };

  // 组件挂载时获取agent列表和命令历史
  useEffect(() => {
    fetchAgents();
    fetchCommandHistory();
    // 每10秒刷新一次agent状态
    const interval = setInterval(() => {
      fetchAgents();
      fetchCommandHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 处理发送命令
  const handleSendCommand = () => {
    if (!selectedAgent) {
      alert('请选择一个agent');
      return;
    }
    if (!command.trim()) {
      alert('请输入命令');
      return;
    }
    sendCommandToAgent(selectedAgent, command);
  };

  // 格式化时间显示
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  // 计算时间差
  const getTimeDiff = (timestamp) => {
    if (!timestamp) return '未知';
    const now = new Date();
    const lastHeartbeat = new Date(timestamp);
    const diffInSeconds = Math.floor((now - lastHeartbeat) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    }
  };

  // 格式化命令输出
  const formatCommandOutput = (result, error) => {
    if (error) {
      return `错误: ${error.error || JSON.stringify(error)}`;
    }
    
    if (result) {
      if (typeof result === 'string') {
        return result;
      }
      
      if (result.stdout) {
        return result.stdout;
      }
      
      if (result.stderr) {
        return `stderr: ${result.stderr}`;
      }
      
      return JSON.stringify(result, null, 2);
    }
    
    return '无输出';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">分布式Agent管理</h3>
        <div className="flex space-x-2">
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新列表'}
          </button>
        </div>
      </div>

      {/* Agent列表 */}
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-700 mb-2">已注册的Agent</h4>
        {agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => {
              const isOnline = agent.lastHeartbeat && 
                (new Date() - new Date(agent.lastHeartbeat)) < 180000; // 3分钟内有心跳认为在线
              
              return (
                <div 
                  key={agent.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAgent === agent.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : isOnline 
                        ? 'border-green-200 bg-green-50 hover:shadow-md' 
                        : 'border-red-200 bg-red-50 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900">{agent.id}</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">主机名:</span> {agent.hostname || '未知'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">平台:</span> {agent.platform || '未知'} {agent.arch || ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">最后心跳:</span> {formatTime(agent.lastHeartbeat)} 
                        <span className={`ml-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                          ({getTimeDiff(agent.lastHeartbeat)})
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isOnline ? '在线' : '离线'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">暂无注册的agent</p>
        )}
      </div>

      {/* 命令发送区域 */}
      {selectedAgent && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-700 mb-2">向选中的Agent发送命令</h4>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">目标Agent</label>
            <input
              type="text"
              value={selectedAgent}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">命令</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="例如: ls -la 或 ps aux"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleSendCommand}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? '发送中...' : '发送命令'}
          </button>
          
          {commandResult && (
            <div className="mt-3 p-3 bg-white border border-gray-300 rounded-md">
              <p className="text-sm text-gray-700">{commandResult}</p>
            </div>
          )}
        </div>
      )}

      {/* 命令执行历史 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-lg font-medium text-gray-700">命令执行历史</h4>
          <button
            onClick={clearCommandHistory}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            清除历史
          </button>
        </div>
        {commandHistory.length > 0 ? (
          <div className="space-y-3">
            {commandHistory.slice(0, 10).map((entry) => (
              <div key={entry.id} className="p-3 border border-gray-200 rounded-md bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium text-gray-900">Agent:</span> {entry.agentId}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTime(entry.timestamp)}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-900">命令:</span> 
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto">{entry.command}</pre>
                </div>
                <div>
                  <span className="font-medium text-gray-900">输出:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                    {formatCommandOutput(entry.result, entry.error)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">暂无命令执行历史</p>
        )}
      </div>

      {/* Agent详细信息 */}
      {selectedAgent && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-700 mb-2">Agent详细信息</h4>
          {agents.filter(a => a.id === selectedAgent).map(agent => (
            <div key={agent.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600"><span className="font-medium">ID:</span> {agent.id}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">主机名:</span> {agent.hostname || '未知'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">平台:</span> {agent.platform || '未知'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">架构:</span> {agent.arch || '未知'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600"><span className="font-medium">总内存:</span> {agent.totalmem ? (agent.totalmem / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '未知'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">空闲内存:</span> {agent.freemem ? (agent.freemem / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '未知'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">运行时间:</span> {agent.uptime ? Math.floor(agent.uptime / 3600) + '小时' : '未知'}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">最后心跳:</span> {formatTime(agent.lastHeartbeat)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentManagement;