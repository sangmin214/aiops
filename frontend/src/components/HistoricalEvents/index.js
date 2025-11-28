import React, { useState } from 'react';
import ImportEvents from './ImportEvents';

const HistoricalEvents = () => {
  const [activeTab, setActiveTab] = useState('import');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'import':
        return <ImportEvents />;
      case 'history':
        return (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">导入历史</h2>
            <p className="text-gray-600">此功能正在开发中...</p>
          </div>
        );
      case 'statistics':
        return (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">统计信息</h2>
            <p className="text-gray-600">此功能正在开发中...</p>
          </div>
        );
      default:
        return <ImportEvents />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">历史事件管理</h1>
        <p className="text-gray-600">导入和管理历史运维事件，丰富知识库内容</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            导入事件
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            导入历史
          </button>
          
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            统计信息
          </button>
        </nav>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default HistoricalEvents;