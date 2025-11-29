const mongoose = require('mongoose');

// 知识库条目模型
const KnowledgeEntrySchema = new mongoose.Schema({
  // 问题描述
  problem: {
    type: String,
    required: true,
    trim: true
  },
  // 根本原因分析
  rootCause: {
    type: String,
    required: true,
    trim: true
  },
  // 解决方案
  solution: {
    type: String,
    required: true,
    trim: true
  },
  // 评分 (1-5星)
  rating: {
    type: Number,
    required: false,
    min: 1,
    max: 5,
    default: null
  },
  // 向量嵌入
  embedding: {
    type: [Number],
    required: true
  },
  // 来源信息
  source: {
    type: String,
    required: false,
    trim: true
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间戳
KnowledgeEntrySchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('KnowledgeEntry', KnowledgeEntrySchema);