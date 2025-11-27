#!/bin/bash

# 启动Qdrant容器
docker run -d \
  --name aiops_qdrant \
  -p 6433:6333 \
  -p 6434:6334 \
  -v qdrant_data:/qdrant/storage \
  --restart unless-stopped \
  qdrant/qdrant:latest

echo "Qdrant container started successfully!"
echo "Container name: aiops_qdrant"
echo "REST API port: 6433"
echo "GRPC port: 6434"