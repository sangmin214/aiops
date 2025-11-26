import React, { useState } from 'react';

const ProblemInput = ({ onSubmit, loading }) => {
  const [problem, setProblem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (problem.trim() && !loading) {
      onSubmit(problem);
    }
  };

  // 添加示例问题以提升用户体验
  const exampleProblems = [
    "如何优化Nginx配置以提高性能？",
    "Docker容器启动失败，如何排查问题？",
    "如何监控服务器CPU和内存使用情况？",
    "Kubernetes Pod无法正常运行怎么办？"
  ];

  const handleExampleClick = (example) => {
    setProblem(example);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">描述您的问题</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="problem" className="block text-gray-700 text-sm font-bold mb-2">
            问题描述
          </label>
          <textarea
            id="problem"
            rows="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="请详细描述您遇到的应用运维问题..."
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            disabled={loading}
          />
        </div>
        
        {/* 添加示例问题区域 */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">示例问题：</p>
          <div className="flex flex-wrap gap-2">
            {exampleProblems.map((example, index) => (
              <button
                key={index}
                type="button"
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded transition duration-150 ease-in-out"
                onClick={() => handleExampleClick(example)}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading || !problem.trim()}
          >
            {loading ? '处理中...' : '获取解决方案'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProblemInput;