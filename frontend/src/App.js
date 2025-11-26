import React, { useState, useEffect } from 'react';
import ProblemInput from './components/ProblemInput';
import SolutionDisplay from './components/SolutionDisplay';

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
      const response = await fetch('http://localhost:3001/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSolution(data.solution);
      } else {
        setError(`错误: ${data.error}`);
      }
    } catch (error) {
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
            <div className="bg-white shadow-xl rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">知识库管理</h2>
              <KnowledgeBase 
                entries={knowledgeEntries} 
                onAdd={addKnowledgeEntry}
                onDelete={deleteKnowledgeEntry}
                loading={loading}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>AI应用运维助手 v1.0 · 基于DeepSeek技术</p>
        </div>
      </div>
    </div>
  );
}

// 知识库管理组件
const KnowledgeBase = ({ entries, onAdd, onDelete, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    problem: '',
    rootCause: '',
    solution: ''
  });
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onAdd(formData);
    if (result.success) {
      setMessage(result.message);
      // 清空表单
      setFormData({
        problem: '',
        rootCause: '',
        solution: ''
      });
      setShowForm(false);
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(result.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个知识库条目吗？')) {
      const result = await onDelete(id);
      setMessage(result.message);
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">知识库条目</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? '取消' : '添加条目'}
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-medium text-gray-800 mb-3">添加新条目</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">
                问题描述
              </label>
              <textarea
                name="problem"
                rows="2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.problem}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">
                根本原因
              </label>
              <textarea
                name="rootCause"
                rows="2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.rootCause}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">
                解决方案
              </label>
              <textarea
                name="solution"
                rows="3"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.solution}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? '添加中...' : '添加条目'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无知识库条目</p>
        ) : (
          entries.map((entry) => (
            <div key={entry._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">问题：{entry.problem}</h4>
                  <p className="text-sm text-gray-600 mt-1"><span className="font-medium">根本原因：</span>{entry.rootCause}</p>
                  <p className="text-sm text-gray-800 mt-2"><span className="font-medium">解决方案：</span>{entry.solution}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="删除条目"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                创建时间: {new Date(entry.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;