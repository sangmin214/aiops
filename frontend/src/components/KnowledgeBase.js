import React, { useState } from 'react';

const KnowledgeBase = ({ entries, onAdd, onDelete, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    problem: '',
    rootCause: '',
    solution: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onAdd(newEntry);
    if (result.success) {
      setNewEntry({ problem: '', rootCause: '', solution: '' });
      setShowForm(false);
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个知识库条目吗？')) {
      await onDelete(id);
    }
  };

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
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? '添加中...' : '添加条目'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {entries && entries.length > 0 ? (
          entries.map(entry => (
            <div key={entry._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{entry.problem}</h4>
                  <p className="text-sm text-gray-600 mt-1"><span className="font-medium">根本原因:</span> {entry.rootCause}</p>
                  <p className="text-sm text-gray-800 mt-2"><span className="font-medium">解决方案:</span> {entry.solution}</p>
                </div>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                  title="删除条目"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">暂无知识库条目</p>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;