让我详细解释一下知识条目的向量化存储和查询匹配过程。首先，我需要查看相关的代码文件来了解具体的实现。


现在让我查看嵌入（向量化）相关的代码：


现在让我查看后端主服务中如何使用这些功能：


让我继续查看知识库路由的实现：


现在让我查看知识库模型的定义：


## 知识条目的向量化存储和查询匹配详解

基于对项目代码的分析，我现在为您详细解释知识条目的向量化存储和查询匹配过程：

### 1. 知识条目的向量化存储过程

#### 步骤1：创建知识条目
当用户在前端创建一个新的知识库条目时，会调用后端API [/api/knowledge](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/routes.js#L15-L59) 的POST方法：

1. 接收包含problem（问题）、rootCause（根本原因）和solution（解决方案）的请求
2. 验证必需字段的存在

#### 步骤2：生成向量嵌入
在[embedding.js](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/embedding.js)中，通过[generateKnowledgeEmbedding](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/embedding.js#L144-L147)函数生成向量：

1. 将问题、根本原因和解决方案拼接成完整文本
2. 调用DeepSeek API生成1536维的向量嵌入
3. 如果API调用失败，会回退到基于哈希的本地向量生成算法

#### 步骤3：存储到MongoDB
在[routes.js](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/routes.js#L15-L59)中：

1. 创建[Mongoose模型](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/models.js#L4-L44)实例
2. 将生成的向量嵌入存储到[embedding](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/models.js#L24-L27)字段
3. 保存到MongoDB数据库

#### 步骤4：存储到Qdrant向量数据库
同样在[routes.js](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/routes.js#L15-L59)中：

1. 调用[qdrant.js](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/qdrant.js)中的[addKnowledgeEntry](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/qdrant.js#L57-L136)函数
2. 将知识条目的ID、向量和元数据存储到Qdrant向量数据库
3. Qdrant使用Cosine距离度量进行相似度计算

### 2. 查询匹配过程

#### 步骤1：接收用户问题
当用户在前端输入问题并请求解决方案时，会调用[/api/solve](file:///Users/licanjing/apps/aiops-tool/backend/server.js#L82-L191) API：

1. 接收用户的问题描述
2. 记录日志并验证输入

#### 步骤2：生成问题向量
在[server.js](file:///Users/licanjing/apps/aiops-tool/backend/server.js)中：

1. 调用[generateEmbedding](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/embedding.js#L14-L56)函数为用户问题生成向量嵌入
2. 使用与创建知识条目时相同的向量化方法

#### 步骤3：向量相似度搜索
调用[qdrant.js](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/qdrant.js)中的[searchSimilarEntries](file:///Users/licanjing/apps/aiops-tool/backend/knowledge/qdrant.js#L144-L177)函数：

1. 在Qdrant数据库中搜索与问题向量最相似的知识条目
2. 默认返回5个最相似的结果
3. 使用余弦相似度计算匹配度

#### 步骤4：过滤和构建上下文
在[server.js](file:///Users/licanjing/apps/aiops-tool/backend/server.js)中：

1. 根据相似度分数过滤结果（当前阈值为0.05）
2. 将匹配的知识条目构建成上下文信息
3. 记录使用的知识库条目链接

#### 步骤5：AI生成解决方案
1. 将构建的上下文信息和用户问题一起发送给DeepSeek API
2. AI模型基于上下文生成针对性的解决方案
3. 返回解决方案以及是否使用了知识库的信息

### 3. 技术特点

1. **双数据库存储**：
   - MongoDB存储完整的知识条目数据
   - Qdrant存储向量表示，专门用于高效相似度搜索

2. **向量维度**：
   - 使用1536维向量，与OpenAI的text-embedding-ada-002模型兼容

3. **相似度度量**：
   - 使用余弦相似度（Cosine Distance）计算向量间相似度

4. **容错机制**：
   - 当DeepSeek API不可用时，会回退到本地哈希算法生成向量
   - 对向量维度不匹配的情况进行了处理

5. **实时同步**：
   - 当知识条目被创建或更新时，会同时更新MongoDB和Qdrant两个数据库
   - 确保数据一致性

这套机制使得系统能够高效地存储和检索知识条目，为用户提供基于历史经验的智能化解决方案。
