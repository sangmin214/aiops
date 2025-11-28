import React, { useContext } from 'react';

const SolutionDisplay = ({ solution, loading, usedKnowledgeBase, knowledgeBaseLinks, onAddToSolutions }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">解决方案</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">AI正在分析问题并生成解决方案...</span>
        </div>
      ) : solution ? (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {/* 显示是否使用了本地知识库 */}
          {usedKnowledgeBase !== undefined && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-blue-800">
                  {usedKnowledgeBase ? '此解决方案基于本地知识库生成' : '此解决方案未使用本地知识库'}
                </span>
              </div>
              
              {/* 显示知识库链接 */}
              {knowledgeBaseLinks && knowledgeBaseLinks.length > 0 && (
                <div className="mt-2 text-sm text-blue-700">
                  <p className="mb-1">参考的知识库条目：</p>
                  <ul className="list-disc list-inside">
                    {knowledgeBaseLinks.map((link, index) => (
                      <li key={index} className="ml-2">
                        <span className="font-medium">"{link.problem}"</span> (相似度: {(link.score * 100).toFixed(2)}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="whitespace-pre-wrap text-gray-700">
            {solution}
          </div>
          
          {/* 添加复制和添加到解决方案按钮 */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => navigator.clipboard.writeText(solution)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm transition duration-150 ease-in-out"
            >
              复制解决方案
            </button>
            <button
              onClick={() => onAddToSolutions && onAddToSolutions(solution, usedKnowledgeBase, knowledgeBaseLinks)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition duration-150 ease-in-out"
            >
              添加到解决方案
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-500">解决方案将显示在这里</p>
          <p className="text-sm text-gray-400 mt-2">请输入您的运维问题以获取AI生成的解决方案</p>
        </div>
      )}
    </div>
  );
};

export default SolutionDisplay;