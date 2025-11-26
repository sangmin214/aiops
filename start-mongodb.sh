#!/bin/bash

# 启动MongoDB容器
docker run -d \
  --name aiops_mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  --restart unless-stopped \
  mongo:5.0

echo "MongoDB container started successfully!"
echo "Container name: aiops_mongodb"
echo "Access port: 27017"
echo "Username: admin"
echo "Password: password"