import React, { useState, useEffect } from 'react';
import ProblemInput from './components/ProblemInput';
import SolutionDisplay from './components/SolutionDisplay';
import KnowledgeBase from './components/KnowledgeBase';
import DependencyGraphTabs from './DependencyGraphTabs';
import AddComponentDependency from './AddComponentDependency';
import ComponentDependencyManagement from './ComponentDependencyManagement';
import AgentManagement from './components/AgentManagement';
import HistoricalEvents from './components/HistoricalEvents';
import SolutionManagement from './components/SolutionManagement';

function App() {
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [knowledgeEntries, setKnowledgeEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('home'); // 默认激活首页
  
  // 新增状态用于存储是否使用了知识库以及知识库链接
  const [usedKnowledgeBase, setUsedKnowledgeBase] = useState(undefined);
  const [knowledgeBaseLinks, setKnowledgeBaseLinks] = useState([]);
  
  // 新增状态用于存储要添加到解决方案的数据
  const [solutionToAdd, setSolutionToAdd] = useState(null);

  const handleProblemSubmit = async (problem) => {
    setLoading(true);
    setSolution('');
    setError('');
    setUsedKnowledgeBase(undefined);
    setKnowledgeBaseLinks([]);
    
    try {
      console.log('Submitting problem:', problem);
      const response = await fetch('http://localhost:3001/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem }),
      });

      const data = await response.json();
      console.log('Response received:', data);
      
      if (response.ok) {
        setSolution(data.solution);
        // 设置是否使用了知识库以及知识库链接
        setUsedKnowledgeBase(data.usedKnowledgeBase);
        setKnowledgeBaseLinks(data.knowledgeBaseLinks || []);
      } else {
        setError(`错误: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError(`网络错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理添加到解决方案
  const handleAddToSolutions = (solutionContent, usedKB, kbLinks) => {
    // 切换到解决方案标签页
    setActiveTab('solution');
    
    // 准备要添加的解决方案数据
    const solutionData = {
      title: 'AI生成的解决方案 - ' + new Date().toLocaleString('zh-CN'),
      content: solutionContent,
      problem: '通过AI自动生成的解决方案',
      tags: usedKB ? ['AI生成', '知识库'] : ['AI生成'],
      isExecutable: false,
      executableScript: '',
      source: 'AI'
    };
    
    // 设置要添加的解决方案数据
    setSolutionToAdd(solutionData);
  };

  // 处理从知识库转换为解决方案
  const handleConvertToSolution = (entry) => {
    // 切换到解决方案标签页
    setActiveTab('solution');
    
    // 准备要添加的解决方案数据
    const solutionData = {
      title: '知识库解决方案 - ' + new Date().toLocaleString('zh-CN'),
      content: entry.solution,
      problem: entry.problem,
      tags: ['知识库', '手动转换'],
      isExecutable: false,
      executableScript: '',
      source: 'KnowledgeBase'
    };
    
    // 设置要添加的解决方案数据
    setSolutionToAdd(solutionData);
  };

  // 获取知识库条目
  const fetchKnowledgeEntries = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/knowledge');
      const data = await response.json();
      if (response.ok) {
        setKnowledgeEntries(data);
      }
    } catch (error) {
      console.error('获取知识库条目失败:', error);
    }
  };

  // 添加新知识库条目
  const addKnowledgeEntry = async (entry) => {
    try {
      const response = await fetch('http://localhost:3001/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 成功添加后刷新知识库列表
        fetchKnowledgeEntries();
        return { success: true, message: '知识库条目添加成功' };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: `网络错误: ${error.message}` };
    }
  };

  // 更新知识库条目
  const updateKnowledgeEntry = async (id, entry) => {
    try {
      const response = await fetch(`http://localhost:3001/api/knowledge/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 成功更新后刷新知识库列表
        fetchKnowledgeEntries();
        return { success: true, message: '知识库条目更新成功' };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: `网络错误: ${error.message}` };
    }
  };

  // 删除知识库条目
  const deleteKnowledgeEntry = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/knowledge/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 成功删除后刷新知识库列表
        fetchKnowledgeEntries();
        return { success: true, message: '知识库条目删除成功' };
      } else {
        const data = await response.json();
        return { success: false, message: data.error };
      }
    } catch (error) {
      return { success: false, message: `网络错误: ${error.message}` };
    }
  };

  // 组件挂载时获取知识库条目
  useEffect(() => {
    fetchKnowledgeEntries();
  }, []);

  // 渲染当前激活的标签页内容
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            <div className="bg-white shadow-xl rounded-lg p-6">
              <ProblemInput onSubmit={handleProblemSubmit} loading={loading} />
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="bg-white shadow-xl rounded-lg p-6">
              <SolutionDisplay 
                solution={solution} 
                loading={loading} 
                usedKnowledgeBase={usedKnowledgeBase}
                knowledgeBaseLinks={knowledgeBaseLinks}
                onAddToSolutions={handleAddToSolutions}
              />
            </div>
          </div>
        );
      case 'knowledge':
        return (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">知识库管理</h2>
            <KnowledgeBase 
              entries={knowledgeEntries} 
              onAdd={addKnowledgeEntry}
              onUpdate={updateKnowledgeEntry}
              onDelete={deleteKnowledgeEntry}
              onConvertToSolution={handleConvertToSolution}
              loading={loading}
            />
          </div>
        );
      case 'dependency':
        return (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <ComponentDependencyManagement />
            <div className="mt-8 bg-white shadow-xl rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">组件依赖关系图</h2>
              <DependencyGraphTabs />
            </div>
          </div>
        );
      case 'agent':
        return (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">分布式Agent管理</h2>
            <AgentManagement />
          </div>
        );
      case 'historical':
        return (
          <HistoricalEvents />
        );
      case 'solution':
        return (
          <SolutionManagement 
            solutionToAdd={solutionToAdd} 
            onSolutionAdded={() => setSolutionToAdd(null)}
          />
        );
      default:
        return (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">欢迎使用AI应用运维助手</h2>
            <p className="text-gray-600">请选择左侧菜单中的功能模块开始使用。</p>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex">
          {/* 左侧菜单 */}
          <div className="w-64 bg-white shadow-lg min-h-screen">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-900">AI运维助手</h1>
              <p className="text-sm text-gray-600 mt-1">应用运维管理平台</p>
            </div>
            
            <nav className="mt-6">
              <ul>
                <li>
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`w-full text-left px-6 py-3 flex items-center transition-colors ${
                      activeTab === 'home' 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="ml-3">首页</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('solution')}
                    className={`w-full text-left px-6 py-3 flex items-center transition-colors ${
                      activeTab === 'solution' 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="ml-3">解决方案</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`w-full text-left px-6 py-3 flex items-center transition-colors ${
                      activeTab === 'knowledge' 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="ml-3">知识库管理</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('dependency')}
                    className={`w-full text-left px-6 py-3 flex items-center transition-colors ${
                      activeTab === 'dependency' 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="ml-3">组件依赖</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('agent')}
                    className={`w-full text-left px-6 py-3 flex items-center transition-colors ${
                      activeTab === 'agent' 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="ml-3">Agent管理</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('historical')}
                    className={`w-full text-left px-6 py-3 flex items-center transition-colors ${
                      activeTab === 'historical' 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="ml-3">历史事件</span>
                  </button>
                </li>
              </ul>
            </nav>
            
            <div className="absolute bottom-0 w-64 p-4 text-center text-sm text-gray-500 border-t">
              <p>AI应用运维助手 v1.0</p>
              <p className="mt-1">基于DeepSeek技术</p>
            </div>
          </div>
          
          {/* 主内容区域 */}
          <div className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">
              {renderActiveTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;