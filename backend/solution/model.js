const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../component/model');

// 定义解决方案模型
const Solution = sequelize.define('Solution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '解决方案标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '解决方案内容'
  },
  problem: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '相关问题描述'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: '标签'
  },
  isExecutable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否可执行'
  },
  executableScript: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '可执行脚本'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '来源（AI生成、手动创建等）'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '版本号'
  },
  // 添加执行记录相关字段，使用下划线命名以匹配数据库
  executionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'executioncount', // 显式指定数据库字段名
    comment: '执行次数'
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'lastexecutedat', // 显式指定数据库字段名
    comment: '最后执行时间'
  }
}, {
  tableName: 'solutions',
  timestamps: true,
  indexes: [
    {
      fields: ['title']
    },
    {
      fields: ['tags']
    },
    {
      fields: ['createdAt']
    },
    // 添加执行次数索引，便于排序
    {
      fields: ['executioncount']
    },
    {
      fields: ['lastexecutedat']
    }
  ]
});

module.exports = Solution;