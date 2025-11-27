import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ComponentDependencyGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphHeight, setGraphHeight] = useState(600); // 默认高度600px，更合适的尺寸
  const [graphWidth, setGraphWidth] = useState(1000); // 默认宽度1000px，更合适的尺寸
  const [fgInstance, setFgInstance] = useState(null); // 保存力导向图实例

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
      
      // 数据更新后居中显示
      if (nodes.length > 0) {
        setTimeout(() => {
          if (fgInstance) {
            // 强制刷新图表显示
            fgInstance.zoomToFit(500, 1);
            fgInstance.centerAt(0, 0); // 居中到画布中心
            // 重新触发引擎以确保正确渲染
            // fgInstance.restart(); // 注释掉不存在的方法
          }
        }, 300);
      }
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
    // 搜索后自动调整画布尺寸并居中显示
    setTimeout(() => {
      // 增加画布尺寸以适应内容
      if (graphWidth < 1000) setGraphWidth(1000);
      if (graphHeight < 600) setGraphHeight(600);
      // 强制居中
      forceCenterGraph();
    }, 500);
  };

  // 节点点击事件
  const handleNodeClick = (node) => {
    fetchDependencyGraph(node.name);
    // 点击节点后自动调整画布尺寸并居中显示
    setTimeout(() => {
      // 增加画布尺寸以适应内容
      if (graphWidth < 1000) setGraphWidth(1000);
      if (graphHeight < 600) setGraphHeight(600);
      // 强制居中
      forceCenterGraph();
    }, 500);
  };

  // 图表初始化回调
  const handleGraphInit = (fg) => {
    // 图表加载完成后自动居中
    if (fg) {
      setFgInstance(() => fg); // 保存实例引用
      // 等待图表渲染完成后再居中
      setTimeout(() => {
        if (graphData.nodes.length > 0) {
          fg.zoomToFit(500, 1);
          fg.centerAt(0, 0); // 居中到画布中心
        }
      }, 300);
    }
  };

  // 图表数据更新后的回调
  const handleGraphUpdate = () => {
    if (fgInstance && graphData.nodes.length > 0) {
      // 数据更新后居中显示
      setTimeout(() => {
        fgInstance.zoomToFit(500, 1);
        fgInstance.centerAt(0, 0); // 居中到画布中心
      }, 100);
    }
  };

  // 监听图表数据变化
  useEffect(() => {
    handleGraphUpdate();
  }, [graphData]);

  // 手动居中图表
  const centerGraph = () => {
    if (fgInstance) {
      // 强制重新计算图表尺寸并居中
      setTimeout(() => {
        fgInstance.zoomToFit(500, 1);
        fgInstance.centerAt(0, 0); // 居中到画布中心，不使用动画
      }, 50);
    }
  };

  // 居中显示图表
  const centerAndFitGraph = () => {
    if (fgInstance && graphData.nodes.length > 0) {
      // 强制重新计算图表尺寸并居中
      setTimeout(() => {
        fgInstance.zoomToFit(500, 1);
        fgInstance.centerAt(0, 0); // 居中到画布中心，不使用动画
      }, 50);
    } else if (fgInstance) {
      // 即使没有数据也尝试居中
      fgInstance.centerAt(0, 0);
    }
  };

  // 强制居中到画布中心
  const forceCenterGraph = () => {
    if (fgInstance) {
      // 先重置视图
      fgInstance.centerAt(0, 0, 0); // 立即居中
      // 然后适配画布
      setTimeout(() => {
        fgInstance.zoomToFit(0, 1); // 立即适配
        fgInstance.centerAt(0, 0, 0); // 再次居中
      }, 10);
    }
  };

  // 强制重绘图表
  const forceRedrawGraph = () => {
    if (fgInstance && graphData.nodes.length > 0) {
      // 保存当前数据
      const currentData = {...graphData};
      // 清空数据再重新设置，强制重绘
      setGraphData({ nodes: [], links: [] });
      setTimeout(() => {
        setGraphData(currentData);
        // 居中显示
        setTimeout(() => {
          if (fgInstance) {
            fgInstance.zoomToFit(500, 1);
            fgInstance.centerAt(0, 0);
          }
        }, 100);
      }, 50);
    }
  };

  // 当图表数据更新时自动居中
  // 已经通过handleGraphUpdate和useEffect实现

  // 处理高度变化
  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    if (!isNaN(newHeight) && newHeight >= 300 && newHeight <= 800) {
      setGraphHeight(newHeight);
    }
  };

  // 处理宽度变化
  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value);
    if (!isNaN(newWidth) && newWidth >= 400 && newWidth <= 1200) {
      setGraphWidth(newWidth);
    }
  };

  return (
    <div style={{ padding: '15px', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '15px' }}>组件依赖关系图</h2>
      
      {/* 搜索表单 */}
      <form onSubmit={handleSearch} style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="输入组件名称，例如: queue1"
          style={{ padding: '8px', marginRight: '10px', width: '250px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        />
        <button 
          type="submit" 
          disabled={loading || !searchTerm.trim()}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#0ea5e9', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !searchTerm.trim() ? 0.7 : 1
          }}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>
      
      {/* 调节控件 */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: '#334155' }}>图表高度:</label>
          <input
            type="range"
            min="300"
            max="800"
            value={graphHeight}
            onChange={handleHeightChange}
            style={{ width: '100px' }}
          />
          <span style={{ minWidth: '40px', color: '#64748b' }}>{graphHeight}px</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: '#334155' }}>图表宽度:</label>
          <input
            type="range"
            min="400"
            max="1200"
            value={graphWidth}
            onChange={handleWidthChange}
            style={{ width: '100px' }}
          />
          <span style={{ minWidth: '40px', color: '#64748b' }}>{graphWidth}px</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={centerGraph}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer'
            }}
          >
            居中显示
          </button>
          <button 
            onClick={centerAndFitGraph}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            居中适配
          </button>
          <button 
            onClick={forceRedrawGraph}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#f97316', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            强制重绘
          </button>
          <button 
            onClick={forceCenterGraph}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            强制居中
          </button>
        </div>
      </div>
      
      {/* 错误信息 */}
      {error && (
        <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      {/* 力导向图容器 - 更加独立的画布 */}
      <div style={{ 
        border: '1px solid rgb(206, 225, 203)', 
        height: `${graphHeight}px`, 
        width: `${graphWidth}px`,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        margin: '20px auto 0', // 适当边距，防止与上方元素重叠
        padding: '10px', // 适当的内边距
        overflow: 'hidden' // 防止内容溢出
      }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel={node => `${node.name} (${node.type})`}
          nodeColor={node => node.color || '#999999'}
          nodeVal={node => 8}
          nodeRelSize={6}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkLabel={link => link.relationType || '关联'}
          linkCurvature={0.1}
          linkWidth={1.5}
          onNodeClick={handleNodeClick}
          onEngineStop={handleGraphInit}
          ref={setFgInstance} /* 保存实例引用 */
          backgroundColor="#ffffff"
          warmupTicks={300}
          cooldownTicks={0}
          d3VelocityDecay={0.95}
          d3AlphaMin={0.01}
          d3AlphaDecay={0.01}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = node.color;
            ctx.fillText(label, node.x, node.y);

            node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
          }}
          onNodeDragEnd={node => {
            node.fx = node.x;
            node.fy = node.y;
            node.fz = node.z;
          }}
        />
      </div>
      
      {/* 图例说明 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>图例说明</h3>
        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#ff0000', borderRadius: '50%' }}></div>
            <span style={{ color: '#334155' }}>中心组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#00ff00', borderRadius: '50%' }}></div>
            <span style={{ color: '#334155' }}>上游组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#0000ff', borderRadius: '50%' }}></div>
            <span style={{ color: '#334155' }}>下游组件</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDependencyGraph;