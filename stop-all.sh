#!/bin/bash

echo "=== 停止AIOPS工具 ==="

# 停止前端和后端服务进程
echo "正在停止前端和后端服务..."
pkill -f "npm start" 2>/dev/null

# 停止Docker容器
echo "正在停止Docker容器..."
docker stop aiops_mongodb aiops_qdrant aiops_postgresql 2>/dev/null

echo ""
echo "=== 所有服务已停止 ==="
echo "✅ 前端服务已停止"
echo "✅ 后端服务已停止"
echo "✅ MongoDB容器已停止"
echo "✅ Qdrant容器已停止"
echo "✅ PostgreSQL容器已停止"