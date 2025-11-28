const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 创建示例数据
const sampleData = [
  {
    TicketNum: 'INC001234',
    Description: 'Web服务器响应缓慢，用户访问网站时经常超时',
    RootCause: '数据库连接池耗尽，导致查询请求排队等待',
    Resolution: '增加数据库连接池大小，优化慢查询SQL语句，添加连接超时监控告警'
  },
  {
    TicketNum: 'INC001256',
    Description: '应用服务器CPU使用率达到100%，系统无响应',
    RootCause: '内存泄漏导致频繁GC，最终触发OOM错误',
    Resolution: '重启应用服务释放内存，部署修复版本，增加内存使用监控'
  },
  {
    TicketNum: 'INC001289',
    Description: '用户无法登录系统，提示认证失败',
    RootCause: 'LDAP服务器证书过期，导致身份验证失败',
    Resolution: '更新LDAP服务器SSL证书，重启认证服务，验证用户登录功能'
  },
  {
    TicketNum: 'INC001345',
    Description: '数据库备份失败，错误代码ORA-19502',
    RootCause: '备份磁盘空间不足，无法写入备份文件',
    Resolution: '清理旧备份文件释放磁盘空间，调整备份策略，设置磁盘空间告警'
  },
  {
    TicketNum: 'INC001402',
    Description: '网络存储NAS设备无法访问，业务系统数据读取失败',
    RootCause: 'NAS设备电源故障导致宕机',
    Resolution: '更换NAS设备电源模块，恢复系统服务，制定设备冗余方案'
  }
];

// 创建工作簿
const workbook = XLSX.utils.book_new();

// 将数据转换为工作表
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// 将工作表添加到工作簿
XLSX.utils.book_append_sheet(workbook, worksheet, 'HistoricalEvents');

// 写入文件
const filePath = path.join(__dirname, 'sample_events.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Sample Excel file created at: ${filePath}`);