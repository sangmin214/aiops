#!/bin/bash

# 启动Qdrant容器
docker run -d \
  --name aiops_qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v qdrant_data:/qdrant/storage \
  --restart unless-stopped \
  qdrant/qdrant:latest

echo "Qdrant container started successfully!"
echo "Container name: aiops_qdrant"
echo "REST API port: 6333"
echo "GRPC port: 6334"