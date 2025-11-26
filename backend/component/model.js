const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 创建PostgreSQL连接
const sequelize = new Sequelize(
  'aiops_db', 
  'aiops_user', 
  'aiops_password', 
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false, // 设置为true可以查看SQL日志
  }
);

// 定义组件模型
const Component = sequelize.define('Component', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'components',
  timestamps: true
});

// 定义组件关系模型
const ComponentRelation = sequelize.define('ComponentRelation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  upstreamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Component,
      key: 'id'
    }
  },
  downstreamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Component,
      key: 'id'
    }
  },
  relationType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'component_relations',
  timestamps: true
});

// 定义关联关系
Component.hasMany(ComponentRelation, { foreignKey: 'upstreamId', as: 'downstreamRelations' });
Component.hasMany(ComponentRelation, { foreignKey: 'downstreamId', as: 'upstreamRelations' });
ComponentRelation.belongsTo(Component, { foreignKey: 'upstreamId', as: 'upstreamComponent' });
ComponentRelation.belongsTo(Component, { foreignKey: 'downstreamId', as: 'downstreamComponent' });

module.exports = {
  sequelize,
  Component,
  ComponentRelation
};