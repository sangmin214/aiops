const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Component, ComponentRelation, sequelize } = require('./model');
const { Op } = require('sequelize');
const { parseExcelFile, processComponentDependencies } = require('./excelImport');

// 配置multer用于处理文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    if (file.mimetype.includes('spreadsheetml') || 
        file.mimetype.includes('excel') || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件 (.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
});

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Component routes are working' });
});

// 创建组件
router.post('/components', async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const component = await Component.create({ name, type, description });
    res.status(201).json(component);
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

// 创建组件关系
router.post('/component-relations', async (req, res) => {
  try {
    const { upstreamName, downstreamName, relationType } = req.body;
    
    // 查找上游组件
    const upstreamComponent = await Component.findOne({ where: { name: upstreamName } });
    if (!upstreamComponent) {
      return res.status(404).json({ error: `Upstream component '${upstreamName}' not found` });
    }
    
    // 查找下游组件
    const downstreamComponent = await Component.findOne({ where: { name: downstreamName } });
    if (!downstreamComponent) {
      return res.status(404).json({ error: `Downstream component '${downstreamName}' not found` });
    }
    
    // 检查是否已存在相同的关系
    const existingRelation = await ComponentRelation.findOne({
      where: {
        upstreamId: upstreamComponent.id,
        downstreamId: downstreamComponent.id,
        relationType: relationType
      }
    });
      
    if (existingRelation) {
      return res.status(409).json({ error: 'Component relation already exists' });
    }
      
    // 创建关系
    const relation = await ComponentRelation.create({
      upstreamId: upstreamComponent.id,
      downstreamId: downstreamComponent.id,
      relationType
    });
    
    res.status(201).json(relation);
  } catch (error) {
    console.error('Error creating component relation:', error);
    res.status(500).json({ error: 'Failed to create component relation' });
  }
});

// 查询组件及其依赖关系
router.get('/component-dependencies/:componentName', async (req, res) => {
  try {
    const { componentName } = req.params;
    
    // 查找指定组件
    const component = await Component.findOne({ 
      where: { name: componentName }
    });
    
    if (!component) {
      return res.status(404).json({ error: `Component '${componentName}' not found` });
    }
    
    // 分别查询上游和下游关系
    const upstreamRelations = await ComponentRelation.findAll({
      where: { downstreamId: component.id },
      include: [{ model: Component, as: 'upstreamComponent' }]
    });
    
    const downstreamRelations = await ComponentRelation.findAll({
      where: { upstreamId: component.id },
      include: [{ model: Component, as: 'downstreamComponent' }]
    });
    
    // 构建依赖关系图数据
    const dependencyGraph = {
      component: {
        id: component.id,
        name: component.name,
        type: component.type,
        description: component.description
      },
      upstream: upstreamRelations.map(relation => ({
        id: relation.upstreamComponent.id,
        name: relation.upstreamComponent.name,
        type: relation.upstreamComponent.type,
        relationType: relation.relationType
      })),
      downstream: downstreamRelations.map(relation => ({
        id: relation.downstreamComponent.id,
        name: relation.downstreamComponent.name,
        type: relation.downstreamComponent.type,
        relationType: relation.relationType
      }))
    };
    
    res.json(dependencyGraph);
  } catch (error) {
    console.error('Error fetching component dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch component dependencies' });
  }
});

// 获取所有组件及其依赖关系
router.get('/components', async (req, res) => {
  try {
    const components = await Component.findAll();
    
    // 为每个组件获取依赖关系
    const componentsWithDeps = await Promise.all(components.map(async (component) => {
      // 获取上游关系
      const upstreamRelations = await ComponentRelation.findAll({
        where: { downstreamId: component.id },
        include: [{ model: Component, as: 'upstreamComponent' }]
      });
      
      // 获取下游关系
      const downstreamRelations = await ComponentRelation.findAll({
        where: { upstreamId: component.id },
        include: [{ model: Component, as: 'downstreamComponent' }]
      });
      
      return {
        ...component.toJSON(),
        upstream: upstreamRelations.map(relation => ({
          id: relation.upstreamComponent.id,
          name: relation.upstreamComponent.name,
          type: relation.upstreamComponent.type,
          relationType: relation.relationType
        })),
        downstream: downstreamRelations.map(relation => ({
          id: relation.downstreamComponent.id,
          name: relation.downstreamComponent.name,
          type: relation.downstreamComponent.type,
          relationType: relation.relationType
        }))
      };
    }));
    
    res.json(componentsWithDeps);
  } catch (error) {
    console.error('Error fetching components with dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch components with dependencies' });
  }
});

// 获取单个组件
router.get('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    res.json(component);
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ error: 'Failed to fetch component' });
  }
});

// 更新组件
router.put('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;
    
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    await component.update({ name, type, description });
    res.json(component);
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
});

// 删除组件
router.delete('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    // 删除相关的组件关系
    await ComponentRelation.destroy({
      where: {
        [Op.or]: [
          { upstreamId: id },
          { downstreamId: id }
        ]
      }
    });
    
    // 删除组件
    await component.destroy();
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// 获取所有组件关系
router.get('/component-relations', async (req, res) => {
  try {
    const relations = await ComponentRelation.findAll({
      include: [
        { model: Component, as: 'upstreamComponent' },
        { model: Component, as: 'downstreamComponent' }
      ]
    });
    res.json(relations);
  } catch (error) {
    console.error('Error fetching component relations:', error);
    res.status(500).json({ error: 'Failed to fetch component relations' });
  }
});

// 获取组件关系
router.get('/component-relations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const relation = await ComponentRelation.findByPk(id);
    if (!relation) {
      return res.status(404).json({ error: 'Component relation not found' });
    }
    res.json(relation);
  } catch (error) {
    console.error('Error fetching component relation:', error);
    res.status(500).json({ error: 'Failed to fetch component relation' });
  }
});

// 更新组件关系
router.put('/component-relations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { upstreamName, downstreamName, relationType } = req.body;
    
    const relation = await ComponentRelation.findByPk(id);
    if (!relation) {
      return res.status(404).json({ error: 'Component relation not found' });
    }
    
    // 查找上游和下游组件
    const upstreamComponent = await Component.findOne({ where: { name: upstreamName } });
    const downstreamComponent = await Component.findOne({ where: { name: downstreamName } });
    
    if (!upstreamComponent || !downstreamComponent) {
      return res.status(404).json({ error: 'Upstream or downstream component not found' });
    }
    
    // 更新关系
    await relation.update({
      upstreamId: upstreamComponent.id,
      downstreamId: downstreamComponent.id,
      relationType
    });
    
    res.json(relation);
  } catch (error) {
    console.error('Error updating component relation:', error);
    res.status(500).json({ error: 'Failed to update component relation' });
  }
});

// 删除组件关系
router.delete('/component-relations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const relation = await ComponentRelation.findByPk(id);
    if (!relation) {
      return res.status(404).json({ error: 'Component relation not found' });
    }
    
    await relation.destroy();
    res.json({ message: 'Component relation deleted successfully' });
  } catch (error) {
    console.error('Error deleting component relation:', error);
    res.status(500).json({ error: 'Failed to delete component relation' });
  }
});

// 删除组件
router.delete('/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    // 删除相关的组件关系
    await ComponentRelation.destroy({
      where: {
        [Op.or]: [
          { upstreamId: id },
          { downstreamId: id }
        ]
      }
    });
    
    // 删除组件
    await component.destroy();
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// 初始化数据库表
router.post('/init-db', async (req, res) => {
  try {
    await sequelize.sync({ force: true });
    res.json({ message: 'Database tables created successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
});

// 导入组件依赖Excel文件
router.post('/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    console.log('Processing Excel file import...');
    
    // 解析Excel文件
    const excelData = parseExcelFile(req.file.buffer);
    console.log(`Parsed ${excelData.length} rows from Excel file`);
    
    // 处理组件依赖数据
    const results = await processComponentDependencies(excelData);
    console.log('Component dependencies processed successfully');
    
    res.json({
      message: '组件依赖导入完成',
      results
    });
  } catch (error) {
    console.error('Error importing component dependencies:', error);
    res.status(500).json({ error: `导入组件依赖失败: ${error.message}` });
  }
});

module.exports = router;