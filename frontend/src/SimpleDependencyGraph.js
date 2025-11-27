import React, { useState, useEffect } from 'react';

const SimpleDependencyGraph = () => {
  const [graphData, setGraphData] = useState({ component: null, upstream: [], downstream: [] });
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
      
      setGraphData({
        component: data.component,
        upstream: data.upstream,
        downstream: data.downstream
      });
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

  // 组件挂载时尝试获取数据
  useEffect(() => {
    // 如果需要默认显示某个组件，可以在这里调用 fetchDependencyGraph('componentName')
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>简化版组件依赖关系图</h2>
      
      {/* 搜索表单 */}
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="输入组件名称，例如: queue1"
          style={{ padding: '10px', marginRight: '10px', width: '300px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>
      
      {/* 错误信息 */}
      {error && (
        <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {/* 简化版依赖关系图 */}
      <div style={{ 
        border: '1px solid #e2e8f0', 
        minHeight: '400px', 
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {loading ? (
          <div style={{ padding: '20px' }}>加载中...</div>
        ) : graphData.component ? (
          <div style={{ width: '100%', maxWidth: '800px' }}>
            {/* 上游组件 */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ textAlign: 'center', color: '#334155', marginBottom: '15px' }}>上游组件</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {graphData.upstream.map((upstream, index) => (
                  <div 
                    key={upstream.id} 
                    style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      border: '2px solid #00ff00',
                      borderRadius: '8px',
                      minWidth: '150px',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#00ff00' }}>{upstream.name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{upstream.type}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                      {upstream.relationType === 'data_flow' ? '数据流' : upstream.relationType}
                    </div>
                  </div>
                ))}
                {graphData.upstream.length === 0 && (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>无上游组件</div>
                )}
              </div>
            </div>
            
            {/* 箭头指向中心组件 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              margin: '10px 0',
              position: 'relative'
            }}>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#94a3b8', 
                width: '80%',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: '-4px',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid #94a3b8',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent'
                }}></div>
              </div>
            </div>
            
            {/* 中心组件 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              margin: '20px 0'
            }}>
              <div 
                style={{
                  padding: '20px',
                  backgroundColor: '#ff0000',
                  color: 'white',
                  border: '2px solid #ffffff',
                  borderRadius: '8px',
                  minWidth: '200px',
                  textAlign: 'center',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{graphData.component.name}</div>
                <div style={{ fontSize: '16px', marginTop: '5px' }}>{graphData.component.type}</div>
                {graphData.component.description && (
                  <div style={{ fontSize: '14px', marginTop: '10px', fontStyle: 'italic' }}>
                    {graphData.component.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* 箭头指向下游组件 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              margin: '10px 0',
              position: 'relative'
            }}>
              <div style={{ 
                height: '2px', 
                backgroundColor: '#94a3b8', 
                width: '80%',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: '-4px',
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid #94a3b8',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent'
                }}></div>
              </div>
            </div>
            
            {/* 下游组件 */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ textAlign: 'center', color: '#334155', marginBottom: '15px' }}>下游组件</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {graphData.downstream.map((downstream, index) => (
                  <div 
                    key={downstream.id} 
                    style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      border: '2px solid #0000ff',
                      borderRadius: '8px',
                      minWidth: '150px',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#0000ff' }}>{downstream.name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{downstream.type}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                      {downstream.relationType === 'data_flow' ? '数据流' : downstream.relationType}
                    </div>
                  </div>
                ))}
                {graphData.downstream.length === 0 && (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>无下游组件</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#94a3b8',
            fontStyle: 'italic'
          }}>
            请输入组件名称并点击搜索按钮查看依赖关系图
          </div>
        )}
      </div>
      
      {/* 图例说明 */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>图例说明</h3>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: '#ff0000', 
              border: '2px solid #ffffff',
              borderRadius: '4px'
            }}></div>
            <span style={{ color: '#334155' }}>中心组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: 'white', 
              border: '2px solid #00ff00',
              borderRadius: '4px'
            }}></div>
            <span style={{ color: '#334155' }}>上游组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: 'white', 
              border: '2px solid #0000ff',
              borderRadius: '4px'
            }}></div>
            <span style={{ color: '#334155' }}>下游组件</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '30px', 
              height: '2px', 
              backgroundColor: '#94a3b8',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                right: '0',
                top: '-4px',
                width: '0',
                height: '0',
                borderLeft: '6px solid #94a3b8',
                borderTop: '3px solid transparent',
                borderBottom: '3px solid transparent'
              }}></div>
            </div>
            <span style={{ color: '#334155' }}>依赖关系</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDependencyGraph;