#!/bin/bash

# 停止并删除MongoDB容器
docker stop aiops_mongodb
docker rm aiops_mongodb

# 停止并删除Qdrant容器
docker stop aiops_qdrant
docker rm aiops_qdrant

# 停止并删除PostgreSQL容器
docker stop aiops_postgresql
docker rm aiops_postgresql

echo "All containers stopped and removed successfully!"