import React, { useState, useEffect } from 'react';

const SolutionManagement = ({ solutionToAdd }) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'create', 'edit'

  // 获取解决方案列表
  const fetchSolutions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/solutions?page=${currentPage}&search=${searchTerm}`);
      const data = await response.json();
      
      if (response.ok) {
        setSolutions(data.solutions);
        setTotalPages(data.totalPages);
      } else {
        setError(data.error || '获取解决方案失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 创建新解决方案
  const createSolution = async (solutionData) => {
    try {
      const response = await fetch('/api/solutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(solutionData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchSolutions();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: '网络错误: ' + err.message };
    }
  };

  // 更新解决方案
  const updateSolution = async (id, solutionData) => {
    try {
      const response = await fetch(`/api/solutions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(solutionData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchSolutions();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: '网络错误: ' + err.message };
    }
  };

  // 删除解决方案
  const deleteSolution = async (id) => {
    if (!window.confirm('确定要删除这个解决方案吗？')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/solutions/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchSolutions();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: '网络错误: ' + err.message };
    }
  };

  // 执行解决方案
  const executeSolution = async (id) => {
    try {
      const response = await fetch(`/api/solutions/${id}/execute`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('解决方案执行已启动，请在Agent管理页面查看执行结果');
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: '网络错误: ' + err.message };
    }
  };

  // 复制解决方案内容
  const copySolution = (content) => {
    navigator.clipboard.writeText(content);
    alert('解决方案已复制到剪贴板');
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchSolutions();
  }, [currentPage, searchTerm]);
  
  // 处理预填充数据
  useEffect(() => {
    if (solutionToAdd) {
      // 打开创建模态框并预填充数据
      setSelectedSolution(solutionToAdd);
      setModalMode('create');
      setShowModal(true);
      // 清除预填充数据
      // 注意：这里不直接清除solutionToAdd，因为父组件会处理
    }
  }, [solutionToAdd]);

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSolutions();
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setSelectedSolution(null);
    setModalMode('create');
    setShowModal(true);
  };

  // 打开编辑模态框
  const openEditModal = (solution) => {
    setSelectedSolution(solution);
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开查看模态框
  const openViewModal = (solution) => {
    setSelectedSolution(solution);
    setModalMode('view');
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setSelectedSolution(null);
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">解决方案管理</h1>
        <p className="text-gray-600">管理、查看和执行AI生成的解决方案</p>
      </div>

      {/* 搜索和操作栏 */}
      <div className="bg-white shadow-xl rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="flex">
              <input
                type="text"
                placeholder="搜索解决方案..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition duration-150 ease-in-out"
              >
                搜索
              </button>
            </div>
          </form>
          
          <button
            onClick={openCreateModal}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            创建解决方案
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* 解决方案列表 */}
      <div className="bg-white shadow-xl rounded-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        ) : solutions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-gray-500">暂无解决方案</p>
            <button
              onClick={openCreateModal}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out"
            >
              创建第一个解决方案
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      标题
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      问题
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      可执行
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solutions.map((solution) => (
                    <tr key={solution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{solution.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-2 max-w-md">
                          {solution.problem || '无问题描述'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {solution.isExecutable ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            是
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            否
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(solution.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openViewModal(solution)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => openEditModal(solution)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          编辑
                        </button>
                        {solution.isExecutable && (
                          <button
                            onClick={() => executeSolution(solution.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            执行
                          </button>
                        )}
                        <button
                          onClick={() => deleteSolution(solution.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 解决方案模态框 */}
      {showModal && (
        <SolutionModal
          solution={selectedSolution}
          mode={modalMode}
          onClose={closeModal}
          onCreate={createSolution}
          onUpdate={updateSolution}
          onCopy={copySolution}
        />
      )}
    </div>
  );
};

// 解决方案模态框组件
const SolutionModal = ({ solution, mode, onClose, onCreate, onUpdate, onCopy }) => {
  const [formData, setFormData] = useState(
    solution || {
      title: '',
      content: '',
      problem: '',
      tags: [],
      isExecutable: false,
      executableScript: '',
      source: 'manual'
    }
  );
  
  // 当solution变化时更新表单数据
  useEffect(() => {
    if (solution) {
      setFormData(solution);
    }
  }, [solution]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 添加标签
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'create') {
        result = await onCreate(formData);
      } else {
        result = await onUpdate(solution.id, formData);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('操作失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 模态框标题
  const getTitle = () => {
    switch (mode) {
      case 'create': return '创建解决方案';
      case 'edit': return '编辑解决方案';
      case 'view': return '查看解决方案';
      default: return '解决方案';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={mode === 'view'}
                className={`w-full px-3 py-2 border rounded-md ${
                  mode === 'view' ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                相关问题
              </label>
              <textarea
                name="problem"
                value={formData.problem}
                onChange={handleChange}
                disabled={mode === 'view'}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  mode === 'view' ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                解决方案内容 *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                disabled={mode === 'view'}
                rows={8}
                className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
                  mode === 'view' ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    {mode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {mode !== 'view' && (
                <div className="flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入标签后按回车添加"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-r-md transition duration-150 ease-in-out"
                  >
                    添加
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isExecutable"
                checked={formData.isExecutable}
                onChange={handleChange}
                disabled={mode === 'view'}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-700">
                可执行解决方案
              </label>
            </div>

            {formData.isExecutable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  可执行脚本
                </label>
                <textarea
                  name="executableScript"
                  value={formData.executableScript}
                  onChange={handleChange}
                  disabled={mode === 'view'}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md font-mono text-sm ${
                    mode === 'view' ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="# 在这里输入可执行的脚本命令"
                />
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            {mode !== 'view' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onCopy(formData.content)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  复制解决方案
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  关闭
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolutionManagement;