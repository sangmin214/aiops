import React, { useState, useEffect, useCallback } from 'react';
import componentTypes from './config/componentTypes';

const AddComponentDependency = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 表单状态
  const [formData, setFormData] = useState({
    componentName: '',
    componentType: '',
    componentDescription: '',
    upstreamComponent: '',
    downstreamComponent: '',
    relationType: 'data_flow'
  });

  // 编辑状态
  const [editingComponent, setEditingComponent] = useState(null);

  // 获取所有组件
  // 获取组件的依赖关系（暂时未使用）
  /*
  const fetchComponentDependencies = async (componentName) => {
    try {
      const response = await fetch(`http://localhost:3001/api/component/component-dependencies/${componentName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching component dependencies:', err);
      return null;
    }
  };
  */

  // 获取所有组件及其依赖关系


  // 获取所有组件及其依赖关系
  const fetchComponentsWithDependencies = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/component/components');
      const data = await response.json();
      
      // 后端API已经返回了包含依赖关系的组件数据，直接使用即可
      setComponents(data);
    } catch (err) {
      console.error('Error fetching components with dependencies:', err);
      setError(`获取组件列表失败: ${err.message}`);
    }
  }, []);

  // 创建新组件
  const createComponent = async (componentData) => {
    try {
      const response = await fetch('http://localhost:3001/api/component/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const newComponent = await response.json();
      return newComponent;
    } catch (err) {
      console.error('Error creating component:', err);
      throw err;
    }
  };

  // 更新组件
  const updateComponent = async (id, componentData) => {
    try {
      const response = await fetch(`http://localhost:3001/api/component/components/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const updatedComponent = await response.json();
      return updatedComponent;
    } catch (err) {
      console.error('Error updating component:', err);
      throw err;
    }
  };

  // 删除组件
  const deleteComponent = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/component/components/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting component:', err);
      throw err;
    }
  };

  // 创建组件关系
  const createComponentRelation = async (relationData) => {
    try {
      const response = await fetch('http://localhost:3001/api/component/component-relations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const newRelation = await response.json();
      return newRelation;
    } catch (err) {
      console.error('Error creating component relation:', err);
      throw err;
    }
  };



  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 移除下游组件字段，因为我们不再需要它
  const filteredComponents = components.filter(component => 
    !editingComponent || component.id !== editingComponent.id
  );

  // 编辑组件
  const handleEditComponent = (component) => {
    setFormData({
      componentName: component.name,
      componentType: component.type,
      componentDescription: component.description || '',
      upstreamComponent: '',
      downstreamComponent: '',
      relationType: 'data_flow'
    });
    setEditingComponent(component);
  };

  // 添加新的依赖关系（暂时未使用）
  /*
  const handleAddDependency = async (componentId, upstreamId, downstreamId, relationType) => {
    try {
      // 这里应该调用后端API来添加新的依赖关系
      // 实现细节取决于后端API的设计
    } catch (err) {
      console.error('Error adding dependency:', err);
    }
  };

  // 删除依赖关系（暂时未使用）
  const handleDeleteDependency = async (relationId) => {
    try {
      // 这里应该调用后端API来删除依赖关系
      // 实现细节取决于后端API的设计
    } catch (err) {
      console.error('Error deleting dependency:', err);
    }
  };

  // 更新依赖关系（暂时未使用）
  const handleUpdateDependency = async (relationId, relationType) => {
    try {
      // 这里应该调用后端API来更新依赖关系
      // 实现细节取决于后端API的设计
    } catch (err) {
      console.error('Error updating dependency:', err);
    }
  };
  */



  // 取消编辑
  const handleCancelEdit = () => {
    setEditingComponent(null);
    setFormData({
      componentName: '',
      componentType: '',
      componentDescription: '',
      upstreamComponent: '',
      downstreamComponent: '',
      relationType: 'data_flow'
    });
  };

  // 删除组件
  const handleDeleteComponent = async (id) => {
    if (window.confirm('确定要删除这个组件吗？')) {
      try {
        await deleteComponent(id);
        setSuccess('组件删除成功！');
        await fetchComponentsWithDependencies(); // 刷新组件列表
      } catch (err) {
        setError(`删除失败: ${err.message}`);
      }
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 创建或更新组件
      if (formData.componentName.trim()) {
        if (editingComponent) {
          // 更新组件
          await updateComponent(editingComponent.id, {
            name: formData.componentName,
            type: formData.componentType,
            description: formData.componentDescription
          });
          setSuccess('组件更新成功！');
          setEditingComponent(null); // 重置编辑状态
        } else {
          // 创建新组件
          await createComponent({
            name: formData.componentName,
            type: formData.componentType,
            description: formData.componentDescription
          });
          setSuccess('组件创建成功！');
        }
      }
      
      // 创建组件关系（如果提供了上游组件或下游组件）
      if (editingComponent) {
        // 在编辑模式下，当前组件可以作为上游或下游组件
        if (formData.upstreamComponent) {
          await createComponentRelation({
            upstreamName: formData.upstreamComponent,
            downstreamName: editingComponent.name,
            relationType: formData.relationType
          });
          setSuccess(prev => prev ? prev + ' 上游关系创建成功！' : '上游关系创建成功！');
        }
        
        if (formData.downstreamComponent) {
          await createComponentRelation({
            upstreamName: editingComponent.name,
            downstreamName: formData.downstreamComponent,
            relationType: formData.relationType
          });
          setSuccess(prev => prev ? prev + ' 下游关系创建成功！' : '下游关系创建成功！');
        }
      } 
      // 在创建模式下，需要提供上游和下游组件
      else if (formData.upstreamComponent && formData.downstreamComponent) {
        await createComponentRelation({
          upstreamName: formData.upstreamComponent,
          downstreamName: formData.downstreamComponent,
          relationType: formData.relationType
        });
        setSuccess(prev => prev ? prev + ' 关系创建成功！' : '关系创建成功！');
      }
      
      // 刷新组件列表
      await fetchComponentsWithDependencies();
      
      // 重置表单（保留关系类型）
      setFormData(prev => ({
        componentName: '',
        componentType: '',
        componentDescription: '',
        upstreamComponent: '',
        downstreamComponent: '',
        relationType: prev.relationType
      }));
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`提交失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取组件列表
  useEffect(() => {
    fetchComponentsWithDependencies();
  }, [fetchComponentsWithDependencies]);

  return (
    <div style={{ padding: '0', maxWidth: '100%' }}>
      <h2>添加组件依赖信息</h2>
      
      {/* 错误信息 */}
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {/* 成功信息 */}
      {success && (
        <div style={{ color: 'green', marginBottom: '20px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <h3>创建新组件</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              组件名称:
              {editingComponent && (
                <span style={{ marginLeft: '10px', fontSize: '14px', color: '#007bff' }}>
                  (编辑模式: {editingComponent.name})
                </span>
              )}
            </label>
            {editingComponent && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px' }}>
                <strong>当前依赖关系:</strong>
                <div style={{ display: 'flex', marginTop: '5px' }}>
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ color: '#28a745', fontWeight: 'bold' }}>上游组件:</div>
                    {editingComponent.upstream && editingComponent.upstream.length > 0 ? (
                      <ul style={{ paddingLeft: '15px', margin: '5px 0 0 0' }}>
                        {editingComponent.upstream.map((up, index) => (
                          <li key={index}>
                            {up.name} <span style={{ fontSize: '12px', color: '#6c757d' }}>({up.relationType})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: '#6c757d' }}>无</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#007bff', fontWeight: 'bold' }}>下游组件:</div>
                    {editingComponent.downstream && editingComponent.downstream.length > 0 ? (
                      <ul style={{ paddingLeft: '15px', margin: '5px 0 0 0' }}>
                        {editingComponent.downstream.map((down, index) => (
                          <li key={index}>
                            {down.name} <span style={{ fontSize: '12px', color: '#6c757d' }}>({down.relationType})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: '#6c757d' }}>无</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <input
              type="text"
              name="componentName"
              value={formData.componentName}
              onChange={handleInputChange}
              placeholder="例如: queue1, serviceA"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>组件类型:</label>
            <select
              name="componentType"
              value={formData.componentType}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">请选择组件类型</option>
              {componentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>组件描述:</label>
            <textarea
              name="componentDescription"
              value={formData.componentDescription}
              onChange={handleInputChange}
              placeholder="组件的详细描述..."
              rows="3"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
        
        {editingComponent && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h3>管理组件关系</h3>
            <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '15px' }}>
              当前组件的依赖关系（只读）：
            </p>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '5px' }}>上游组件:</div>
                {editingComponent.upstream && editingComponent.upstream.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: '0' }}>
                    {editingComponent.upstream.map((up, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>
                        <span>{up.name}</span>
                        <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '5px' }}>({up.relationType})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: '#6c757d' }}>无上游组件</span>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ color: '#007bff', fontWeight: 'bold', marginBottom: '5px' }}>下游组件:</div>
                {editingComponent.downstream && editingComponent.downstream.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: '0' }}>
                    {editingComponent.downstream.map((down, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>
                        <span>{down.name}</span>
                        <span style={{ fontSize: '12px', color: '#6c757d', marginLeft: '5px' }}>({down.relationType})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: '#6c757d' }}>无下游组件</span>
                )}
              </div>
            </div>
            
            <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '15px' }}>
              如需修改依赖关系，请在下方创建新的关系（当前组件将作为下游组件）：
            </p>
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <h3>创建新的组件关系</h3>
          
          {editingComponent ? (
            // 编辑模式：只需要上游组件
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>上游组件:</label>
                <select
                  name="upstreamComponent"
                  value={formData.upstreamComponent}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">请选择上游组件</option>
                  {filteredComponents.map(component => (
                    <option key={component.id} value={component.name}>
                      {component.name} ({component.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>下游组件:</label>
                <select
                  name="downstreamComponent"
                  value={formData.downstreamComponent}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">请选择下游组件</option>
                  {filteredComponents.map(component => (
                    <option key={component.id} value={component.name}>
                      {component.name} ({component.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>关系类型:</label>
                <select
                  name="relationType"
                  value={formData.relationType}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="data_flow">数据流</option>
                  <option value="dependency">依赖</option>
                  <option value="trigger">触发</option>
                  <option value="notification">通知</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '10px' }}>
                注意：当前正在编辑的组件将自动作为上游或下游组件
              </p>
            </>
          ) : (
            // 创建模式：需要上游和下游组件
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>上游组件:</label>
                <select
                  name="upstreamComponent"
                  value={formData.upstreamComponent}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">请选择上游组件</option>
                  {components.map(component => (
                    <option key={component.id} value={component.name}>
                      {component.name} ({component.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>下游组件:</label>
                <select
                  name="downstreamComponent"
                  value={formData.downstreamComponent}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">请选择下游组件</option>
                  {components.map(component => (
                    <option key={component.id} value={component.name}>
                      {component.name} ({component.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>关系类型:</label>
                <select
                  name="relationType"
                  value={formData.relationType}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="data_flow">数据流</option>
                  <option value="dependency">依赖</option>
                  <option value="trigger">触发</option>
                  <option value="notification">通知</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '提交中...' : editingComponent ? '更新组件' : '创建组件'}
          </button>
          {editingComponent && (
            <button 
              type="button" 
              onClick={handleCancelEdit}
              disabled={loading}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              取消编辑
            </button>
          )}
        </div>
      </form>
      
      {/* 已有组件列表 */}
      <div style={{ marginTop: '20px' }}>
        <h3>已有组件列表</h3>
        {components.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ border: '1px solid #dee2e6', padding: '6px' }}>ID</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '6px' }}>名称</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '6px' }}>类型</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '6px' }}>上游组件</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '6px' }}>下游组件</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '6px', width: '100px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {components.map(component => (
                  <tr key={component.id}>
                    <td style={{ border: '1px solid #dee2e6', padding: '6px' }}>{component.id}</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '6px' }}>{component.name}</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '6px' }}>{component.type}</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '6px' }}>
                      {component.upstream && component.upstream.length > 0 ? (
                        <div>
                          {component.upstream.map((up, index) => (
                            <div key={index} style={{ marginBottom: '1px' }}>
                              <span style={{ color: '#28a745' }}>{up.name}</span>
                              <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: '3px' }}>({up.relationType})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#6c757d' }}>-</span>
                      )}
                    </td>
                    <td style={{ border: '1px solid #dee2e6', padding: '6px' }}>
                      {component.downstream && component.downstream.length > 0 ? (
                        <div>
                          {component.downstream.map((down, index) => (
                            <div key={index} style={{ marginBottom: '1px' }}>
                              <span style={{ color: '#007bff' }}>{down.name}</span>
                              <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: '3px' }}>({down.relationType})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#6c757d' }}>-</span>
                      )}
                    </td>
                    <td style={{ border: '1px solid #dee2e6', padding: '6px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleEditComponent(component)}
                        style={{ 
                          padding: '3px 6px', 
                          backgroundColor: '#ffc107', 
                          color: 'black', 
                          border: 'none', 
                          borderRadius: '3px', 
                          cursor: 'pointer',
                          marginRight: '3px',
                          fontSize: '12px'
                        }}
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDeleteComponent(component.id)}
                        style={{ 
                          padding: '3px 6px', 
                          backgroundColor: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>暂无组件数据</p>
        )}
      </div>
    </div>
  );
};

export default AddComponentDependency;