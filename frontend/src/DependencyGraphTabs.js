import React, { useState } from 'react';
import ComponentDependencyGraph from './ComponentDependencyGraph';
import SimpleDependencyGraph from './SimpleDependencyGraph';

const DependencyGraphTabs = () => {
  const [activeTab, setActiveTab] = useState('force'); // 'force' 或 'simple'

  return (
    <div>
      {/* 选项卡导航 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'force'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('force')}
        >
          力导向图
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'simple'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('simple')}
        >
          简化箭线图
        </button>
      </div>

      {/* 选项卡内容 */}
      <div>
        {activeTab === 'force' ? (
          <ComponentDependencyGraph />
        ) : (
          <SimpleDependencyGraph />
        )}
      </div>
    </div>
  );
};

export default DependencyGraphTabs;