#!/bin/bash

# 启动PostgreSQL容器
docker run -d \
  --name aiops_postgresql \
  -p 5432:5432 \
  -e POSTGRES_USER=aiops_user \
  -e POSTGRES_PASSWORD=aiops_password \
  -e POSTGRES_DB=aiops_db \
  -v postgresql_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15

echo "PostgreSQL container started successfully!"
echo "Container name: aiops_postgresql"
echo "Access port: 5432"
echo "Database: aiops_db"
echo "Username: aiops_user"
echo "Password: aiops_password"