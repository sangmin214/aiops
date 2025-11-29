const { DataTypes } = require('sequelize');
const { sequelize } = require('../component/model');

// 定义命令执行历史模型
const CommandHistory = sequelize.define('CommandHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'agentid',  // 显式指定数据库列名
    comment: 'Agent ID'
  },
  command: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '执行的命令'
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '命令执行结果'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '命令执行错误信息'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '执行时间'
  }
}, {
  tableName: 'command_history',
  timestamps: false,
  indexes: [
    {
      fields: ['agentid']  // 使用数据库中的实际列名
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = CommandHistory;