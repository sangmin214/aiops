import React, { useState } from 'react';

const KnowledgeBase = ({ entries, onAdd, onDelete, onUpdate, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState({
    problem: '',
    rootCause: '',
    solution: ''
  });
  const [searchQuery, setSearchQuery] = useState(''); // 添加搜索查询状态
  const [searchResults, setSearchResults] = useState([]); // 添加搜索结果状态
  const [isSearching, setIsSearching] = useState(false); // 添加搜索状态

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      // 更新现有条目
      const result = await onUpdate(editingId, newEntry);
      if (result.success) {
        setNewEntry({ problem: '', rootCause: '', solution: '' });
        setShowForm(false);
        setEditingId(null);
      } else {
        alert(result.message);
      }
    } else {
      // 添加新条目
      const result = await onAdd(newEntry);
      if (result.success) {
        setNewEntry({ problem: '', rootCause: '', solution: '' });
        setShowForm(false);
      } else {
        alert(result.message);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个知识库条目吗？')) {
      await onDelete(id);
    }
  };

  const handleEdit = (entry) => {
    setNewEntry({
      problem: entry.problem,
      rootCause: entry.rootCause,
      solution: entry.solution
    });
    setEditingId(entry._id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setNewEntry({ problem: '', rootCause: '', solution: '' });
    setShowForm(false);
    setEditingId(null);
  };

  // 处理搜索功能
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3001/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data);
      } else {
        console.error('搜索失败:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索出错:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 清除搜索结果
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // 确定要显示的条目（搜索结果优先，否则显示所有条目）
  const displayEntries = searchResults.length > 0 ? searchResults : entries;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">知识库条目</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showForm ? '取消' : '添加条目'}
        </button>
      </div>

      {/* 搜索表单 */}
      <form onSubmit={handleSearch} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索问题、原因或解决方案..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
          {(searchResults.length > 0 || searchQuery) && (
            <button
              type="button"
              onClick={clearSearch}
              className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              清除
            </button>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            找到 {searchResults.length} 个匹配的结果
          </div>
        )}
      </form>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
            <input
              type="text"
              name="problem"
              value={newEntry.problem}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">根本原因</label>
            <textarea
              name="rootCause"
              value={newEntry.rootCause}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
            <textarea
              name="solution"
              value={newEntry.solution}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? (editingId ? '更新中...' : '添加中...') : (editingId ? '更新条目' : '添加条目')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {displayEntries && displayEntries.length > 0 ? (
          displayEntries.map(entry => (
            <div key={entry._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{entry.problem}</h4>
                  <p className="text-sm text-gray-600 mt-1"><span className="font-medium">根本原因:</span> {entry.rootCause}</p>
                  <p className="text-sm text-gray-800 mt-2"><span className="font-medium">解决方案:</span> {entry.solution}</p>
                </div>
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="text-blue-500 hover:text-blue-700"
                    title="编辑条目"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="text-red-500 hover:text-red-700"
                    title="删除条目"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : searchQuery ? (
          <p className="text-gray-500 text-center py-4">未找到匹配的知识库条目</p>
        ) : (
          <p className="text-gray-500 text-center py-4">暂无知识库条目</p>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;