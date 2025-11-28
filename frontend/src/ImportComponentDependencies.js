import React, { useState } from 'react';

const ImportComponentDependencies = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // 检查文件类型
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls')) {
        setError('请上传Excel文件 (.xlsx 或 .xls)');
        setFile(null);
        return;
      }
      
      // 检查文件大小 (最大10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过10MB');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请选择一个Excel文件');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/api/component/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // 导入成功后通知父组件刷新数据
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        setError(data.error || '导入失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">导入组件依赖</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          选择Excel文件
        </label>
        
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            选择文件
          </label>
          
          {file && (
            <div className="flex items-center text-sm text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{file.name} ({formatFileSize(file.size)})</span>
            </div>
          )}
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          支持 .xlsx 和 .xls 格式，文件大小不超过 10MB
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`py-2 px-6 rounded-lg font-medium transition duration-150 ease-in-out ${
          !file || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {uploading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            导入中...
          </span>
        ) : (
          '导入组件依赖'
        )}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">导入完成</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">总条目数</p>
              <p className="text-2xl font-bold text-gray-800">{result.results.total}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">创建组件</p>
              <p className="text-2xl font-bold text-green-600">{result.results.componentsCreated}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">创建关系</p>
              <p className="text-2xl font-bold text-blue-600">{result.results.relationsCreated}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">导入失败</p>
              <p className="text-2xl font-bold text-red-600">{result.results.errors.length}</p>
            </div>
          </div>
          
          {result.results.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">错误详情:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {result.results.errors.slice(0, 5).map((err, index) => (
                  <li key={index}>
                    {err.item.name || err.item.source}: {err.error}
                  </li>
                ))}
                {result.results.errors.length > 5 && (
                  <li>...还有 {result.results.errors.length - 5} 个错误</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">使用说明</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Excel文件必须包含以下列: name, type, source, destination</li>
          <li>name: 组件名称，type: 组件类型</li>
          <li>source: 上游组件，destination: 下游组件</li>
          <li>系统会自动创建不存在的组件和组件依赖关系</li>
          <li>导入过程可能需要一些时间，请耐心等待</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportComponentDependencies;