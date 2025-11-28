const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const KnowledgeEntry = require('./models');
const { generateKnowledgeEmbedding } = require('./embedding');
const { addKnowledgeEntry } = require('./qdrant');

/**
 * 创建新的知识库条目
 * @route POST /api/knowledge
 * @param {string} problem - 问题描述
 * @param {string} rootCause - 根本原因分析
 * @param {string} solution - 解决方案
 */
router.post('/knowledge', async (req, res) => {
  try {
    const { problem, rootCause, solution } = req.body;
    
    // 验证必需字段
    if (!problem || !rootCause || !solution) {
      return res.status(400).json({
        error: 'Missing required fields: problem, rootCause, solution'
      });
    }
    
    console.log('Creating new knowledge entry:', { problem, rootCause, solution });
    
    // 创建知识库条目
    const knowledgeEntry = new KnowledgeEntry({
      problem,
      rootCause,
      solution
    });
    
    // 生成向量嵌入
    const embedding = await generateKnowledgeEmbedding(knowledgeEntry);
    knowledgeEntry.embedding = embedding;
    
    // 保存到MongoDB
    const savedEntry = await knowledgeEntry.save();
    console.log('Knowledge entry saved to MongoDB:', savedEntry._id);
    
    // 添加到向量数据库
    await addKnowledgeEntry(savedEntry._id.toString(), embedding, {
      problem: savedEntry.problem,
      rootCause: savedEntry.rootCause,
      solution: savedEntry.solution,
      createdAt: savedEntry.createdAt
    });
    console.log('Knowledge entry added to Qdrant vector database');
    
    res.status(201).json({
      message: 'Knowledge entry created successfully',
      entry: savedEntry
    });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(500).json({ error: 'Failed to create knowledge entry' });
  }
});

/**
 * 获取所有知识库条目
 * @route GET /api/knowledge
 */
router.get('/knowledge', async (req, res) => {
  try {
    const entries = await KnowledgeEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge entries' });
  }
});

/**
 * 根据关键词搜索知识库条目
 * @route GET /api/knowledge/search
 */
router.get('/knowledge/search', async (req, res) => {
  try {
    console.log('Search API called with query:', req.query);
    const { q } = req.query;
    
    if (!q) {
      console.log('Search query is missing');
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    console.log('Searching for:', q);
    
    // 使用正则表达式进行模糊搜索
    const searchRegex = new RegExp(q, 'i'); // 'i' 表示不区分大小写
    const entries = await KnowledgeEntry.find({
      $or: [
        { problem: searchRegex },
        { rootCause: searchRegex },
        { solution: searchRegex }
      ]
    }).sort({ createdAt: -1 });
    
    console.log('Search results count:', entries.length);
    res.json(entries);
  } catch (error) {
    console.error('Error searching knowledge entries:', error);
    res.status(500).json({ error: 'Failed to search knowledge entries' });
  }
});

/**
 * 根据ID获取知识库条目
 * @route GET /api/knowledge/:id
 */
router.get('/knowledge/:id', async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Error fetching knowledge entry:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge entry' });
  }
});

/**
 * 删除知识库条目
 * @route DELETE /api/knowledge/:id
 */
router.delete('/knowledge/:id', async (req, res) => {
  try {
    const entry = await KnowledgeEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    res.json({ message: 'Knowledge entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    res.status(500).json({ error: 'Failed to delete knowledge entry' });
  }
});

/**
 * 更新知识库条目
 * @route PUT /api/knowledge/:id
 * @param {string} problem - 问题描述
 * @param {string} rootCause - 根本原因分析
 * @param {string} solution - 解决方案
 */
router.put('/knowledge/:id', async (req, res) => {
  try {
    const { problem, rootCause, solution } = req.body;
    
    // 验证必需字段
    if (!problem || !rootCause || !solution) {
      return res.status(400).json({
        error: 'Missing required fields: problem, rootCause, solution'
      });
    }
    
    console.log('Updating knowledge entry:', req.params.id, { problem, rootCause, solution });
    
    // 查找并更新知识库条目
    const knowledgeEntry = await KnowledgeEntry.findById(req.params.id);
    if (!knowledgeEntry) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }
    
    // 更新字段
    knowledgeEntry.problem = problem;
    knowledgeEntry.rootCause = rootCause;
    knowledgeEntry.solution = solution;
    
    // 重新生成向量嵌入
    const embedding = await generateKnowledgeEmbedding(knowledgeEntry);
    knowledgeEntry.embedding = embedding;
    
    // 保存到MongoDB
    const updatedEntry = await knowledgeEntry.save();
    console.log('Knowledge entry updated in MongoDB:', updatedEntry._id);
    
    // 更新向量数据库中的条目
    await addKnowledgeEntry(updatedEntry._id.toString(), embedding, {
      problem: updatedEntry.problem,
      rootCause: updatedEntry.rootCause,
      solution: updatedEntry.solution,
      createdAt: updatedEntry.createdAt
    });
    console.log('Knowledge entry updated in Qdrant vector database');
    
    res.json({
      message: 'Knowledge entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    res.status(500).json({ error: 'Failed to update knowledge entry' });
  }
});

module.exports = router;