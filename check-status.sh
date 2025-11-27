#!/bin/bash

echo "=== AIOPS Tool Status Check ==="

# 检查后端服务
if lsof -i :3001 | grep -q LISTEN; then
  echo "✅ 后端服务: 运行中 (端口 3001)"
else
  echo "❌ 后端服务: 未运行"
fi

# 检查前端服务
if lsof -i :3002 | grep -q LISTEN; then
  echo "✅ 前端服务: 运行中 (端口 3002)"
else
  echo "❌ 前端服务: 未运行"
fi

# 检查Docker容器
echo ""
echo "=== Docker容器状态 ==="
containers=("aiops_mongodb" "aiops_qdrant" "aiops_postgresql")
for container in "${containers[@]}"; do
  if docker ps | grep -q "$container"; then
    echo "✅ $container: 运行中"
  else
    echo "❌ $container: 未运行"
  fi
done

# 显示端口映射
echo ""
echo "=== 端口映射 ==="
echo "MongoDB: 27017 -> 27017"
echo "Qdrant: 6433-6434 -> 6333-6334"
echo "PostgreSQL: 5442 -> 5432"

echo ""
echo "=== 访问地址 ==="
echo "前端界面: http://localhost:3002"
echo "后端API: http://localhost:3001"