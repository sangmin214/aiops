#!/bin/bash

echo "=== 启动AIOPS工具 ==="

# 启动基础设施组件
echo "正在启动基础设施组件..."
cd /Users/licanjing/apps/aiops-tool

# 检查并启动MongoDB
if ! docker ps | grep -q "aiops_mongodb"; then
  echo "启动MongoDB..."
  ./start-mongodb.sh
else
  echo "✅ MongoDB已在运行"
fi

# 检查并启动Qdrant
if ! docker ps | grep -q "aiops_qdrant"; then
  echo "启动Qdrant..."
  ./start-qdrant.sh
else
  echo "✅ Qdrant已在运行"
fi

# 检查并启动PostgreSQL
if ! docker ps | grep -q "aiops_postgresql"; then
  echo "启动PostgreSQL..."
  ./start-postgresql.sh
else
  echo "✅ PostgreSQL已在运行"
fi

# 等待数据库启动
echo "等待数据库启动完成..."
sleep 10

echo ""
echo "=== 所有基础设施组件已启动 ==="
echo "MongoDB: 27017端口"
echo "Qdrant: 6333-6334端口"
echo "PostgreSQL: 5442端口 (内部5432端口)"

echo ""
echo "请手动启动后端和前端服务："
echo "后端服务: cd /Users/licanjing/apps/aiops-tool/backend && npm start"
echo "前端服务: cd /Users/licanjing/apps/aiops-tool/frontend && npm start"