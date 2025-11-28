import React, { useState } from 'react';
import AddComponentDependency from './AddComponentDependency';
import ImportComponentDependencies from './ImportComponentDependencies';

const ComponentDependencyManagement = () => {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'import'

  const handleImportSuccess = () => {
    // 可以在这里添加导入成功后的处理逻辑
    console.log('Component dependencies imported successfully');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">组件依赖管理</h1>
        <p className="text-gray-600">管理应用中的组件及其依赖关系</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            手动添加
          </button>
          
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Excel导入
          </button>
        </nav>
      </div>

      {activeTab === 'manual' ? (
        <AddComponentDependency />
      ) : (
        <ImportComponentDependencies onImportSuccess={handleImportSuccess} />
      )}
    </div>
  );
};

export default ComponentDependencyManagement;