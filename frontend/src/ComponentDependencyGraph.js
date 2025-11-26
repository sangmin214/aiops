import React, { useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ComponentDependencyGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取组件依赖关系图数据
  const fetchDependencyGraph = async (componentName) => {
    if (!componentName) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/component/component-dependencies/${componentName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 转换数据格式为力导向图所需格式
      const nodes = [];
      const links = [];
      
      // 添加中心节点
      nodes.push({
        id: data.component.id,
        name: data.component.name,
        type: data.component.type,
        description: data.component.description,
        color: '#ff0000' // 中心节点用红色标识
      });
      
      // 添加上游节点和连接
      data.upstream.forEach(upstream => {
        // 检查节点是否已存在
        if (!nodes.find(node => node.id === upstream.id)) {
          nodes.push({
            id: upstream.id,
            name: upstream.name,
            type: upstream.type,
            color: '#00ff00' // 上游节点用绿色标识
          });
        }
        
        // 添加连接
        links.push({
          source: upstream.id,
          target: data.component.id,
          relationType: upstream.relationType
        });
      });
      
      // 添加下游节点和连接
      data.downstream.forEach(downstream => {
        // 检查节点是否已存在
        if (!nodes.find(node => node.id === downstream.id)) {
          nodes.push({
            id: downstream.id,
            name: downstream.name,
            type: downstream.type,
            color: '#0000ff' // 下游节点用蓝色标识
          });
        }
        
        // 添加连接
        links.push({
          source: data.component.id,
          target: downstream.id,
          relationType: downstream.relationType
        });
      });
      
      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error fetching dependency graph:', err);
      setError(`获取依赖关系图失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    fetchDependencyGraph(searchTerm);
  };

  // 节点点击事件
  const handleNodeClick = (node) => {
    fetchDependencyGraph(node.name);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>组件依赖关系图</h2>
      
      {/* 搜索表单 */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="输入组件名称，例如: queue1"
          style={{ padding: '8px', marginRight: '10px', width: '300px' }}
        />
        <button 
          type="submit" 
          disabled={loading || !searchTerm.trim()}
          style={{ padding: '8px 16px' }}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>
      
      {/* 错误信息 */}
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {/* 力导向图 */}
      <div style={{ border: '1px solid #ccc', height: '250px' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={node => `${node.name} (${node.type})`}
          nodeColor={node => node.color || '#999999'}
          nodeVal={node => 10}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLabel={link => link.relationType || '关联'}
          onNodeClick={handleNodeClick}
          backgroundColor="#ffffff"
        />
      </div>
      
      {/* 图例说明 */}
      <div style={{ marginTop: '20px' }}>
        <h3>图例说明</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ff0000', marginRight: '5px' }}></div>
            <span>中心组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#00ff00', marginRight: '5px' }}></div>
            <span>上游组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#0000ff', marginRight: '5px' }}></div>
            <span>下游组件</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDependencyGraph;