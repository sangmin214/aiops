import React, { useState, useEffect } from 'react';

const Statistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3001/api/historical-events/statistics');
      const data = await response.json();
      
      if (response.ok) {
        setStatistics(data);
      } else {
        setError(data.error || '获取统计信息失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // 渲染统计数据卡片
  const renderStatCard = (title, value, subtitle = '') => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  // 渲染趋势图表
  const renderTrendChart = () => {
    if (!statistics || !statistics.recentStats || statistics.recentStats.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">最近7天导入趋势</h3>
          <div className="text-center py-8 text-gray-500">
            暂无数据
          </div>
        </div>
      );
    }

    const dates = statistics.recentStats.map(item => item.date);
    const totals = statistics.recentStats.map(item => item.records);
    const successes = statistics.recentStats.map(item => item.success);
    const failures = statistics.recentStats.map(item => item.failed);

    // 找到最大值用于比例计算
    const maxValue = Math.max(...totals, 1);

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">最近7天导入趋势</h3>
        <div className="space-y-4">
          {statistics.recentStats.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{item.date}</span>
                <span>{item.records} 条记录</span>
              </div>
              <div className="flex h-6 rounded-full overflow-hidden bg-gray-200">
                <div 
                  className="bg-green-500 flex items-center justify-center text-xs text-white"
                  style={{ width: `${(item.success / maxValue) * 100}%` }}
                >
                  {item.success > 0 ? item.success : ''}
                </div>
                <div 
                  className="bg-red-500 flex items-center justify-center text-xs text-white"
                  style={{ width: `${(item.failed / maxValue) * 100}%` }}
                >
                  {item.failed > 0 ? item.failed : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">统计信息</h2>
        <button
          onClick={fetchStatistics}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition duration-150 ease-in-out disabled:opacity-50"
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">加载中...</span>
        </div>
      ) : statistics ? (
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderStatCard('总导入次数', statistics.totalImports)}
            {renderStatCard('总记录数', statistics.totalRecords)}
            {renderStatCard('成功导入', statistics.totalSuccess)}
            {renderStatCard('导入成功率', `${statistics.successRate}%`)}
          </div>

          {/* 趋势图表 */}
          {renderTrendChart()}

          {/* 详细统计 */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      统计项
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数值
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      总导入次数
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {statistics.totalImports}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      总记录数
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {statistics.totalRecords}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      成功导入
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {statistics.totalSuccess}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      导入失败
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {statistics.totalFailed}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      导入成功率
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {statistics.successRate}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">暂无统计信息</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;