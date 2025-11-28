import React, { useState, useEffect } from 'react';
import ProblemInput from './components/ProblemInput';
import SolutionDisplay from './components/SolutionDisplay';
import KnowledgeBase from './components/KnowledgeBase';
import DependencyGraphTabs from './DependencyGraphTabs';
import AddComponentDependency from './AddComponentDependency';
import AgentManagement from './components/AgentManagement';

function App() {
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [knowledgeEntries, setKnowledgeEntries] = useState([]);

  const handleProblemSubmit = async (problem) => {
    setLoading(true);
    setSolution('');
    setError('');
    
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

  return (
    <div className="App">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI应用运维助手</h1>
            <p className="text-lg text-gray-600">描述您的运维问题，AI将为您提供解决方案</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
                <ProblemInput onSubmit={handleProblemSubmit} loading={loading} />
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
                  {error}
                </div>
              )}
              
              <div className="bg-white shadow-xl rounded-lg p-6">
                <SolutionDisplay solution={solution} loading={loading} />
              </div>
            </div>
            
            <div>
              <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">知识库管理</h2>
                <KnowledgeBase 
                  entries={knowledgeEntries} 
                  onAdd={addKnowledgeEntry}
                  onUpdate={updateKnowledgeEntry}
                  onDelete={deleteKnowledgeEntry}
                  loading={loading}
                />
              </div>
            </div>
          </div>
          
          {/* 添加组件依赖信息 */}
          <div className="mt-8 bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">添加组件依赖信息</h2>
            <AddComponentDependency />
          </div>
          
          {/* 组件依赖关系图 - 独立显示 */}
          <div className="mt-8 bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">组件依赖关系图</h2>
            <DependencyGraphTabs />
          </div>
          
          {/* Agent管理 */}
          <div className="mt-8 bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">分布式Agent管理</h2>
            <AgentManagement />
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>AI应用运维助手 v1.0 · 基于DeepSeek技术</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;