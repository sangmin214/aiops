const { sequelize } = require('./model');

async function initDatabase() {
  try {
    // 同步数据库模型
    await sequelize.sync({ force: true });
    console.log('Database tables created successfully');
    
    // 插入一些示例数据
    const { Component, ComponentRelation } = require('./model');
    
    // 创建示例组件
    const queue1 = await Component.create({
      name: 'queue1',
      type: 'Queue',
      description: '消息队列组件'
    });
    
    const componentA = await Component.create({
      name: 'componentA',
      type: 'Service',
      description: '业务处理服务'
    });
    
    const sftp1 = await Component.create({
      name: 'sftp1',
      type: 'Storage',
      description: 'SFTP存储服务'
    });
    
    // 创建组件关系
    await ComponentRelation.create({
      upstreamId: queue1.id,
      downstreamId: componentA.id,
      relationType: 'data_flow'
    });
    
    await ComponentRelation.create({
      upstreamId: componentA.id,
      downstreamId: sftp1.id,
      relationType: 'data_flow'
    });
    
    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;