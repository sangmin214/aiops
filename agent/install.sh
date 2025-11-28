#!/bin/bash

# Agent安装脚本

echo "Installing AI-Ops Agent..."

# 检查是否已安装Node.js
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# 检查是否已安装npm
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# 安装依赖
echo "Installing dependencies..."
npm install

# 创建systemd服务文件（仅在支持systemd的系统上）
if command -v systemctl &> /dev/null
then
    echo "Creating systemd service..."
    sudo tee /etc/systemd/system/aiops-agent.service > /dev/null <<EOF
[Unit]
Description=AI-Ops Agent
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载systemd配置
    sudo systemctl daemon-reload
    
    echo "Systemd service created. You can start the agent with:"
    echo "sudo systemctl start aiops-agent"
    echo "sudo systemctl enable aiops-agent  # To start on boot"
fi

echo "Installation complete!"
echo "Run 'npm start' to start the agent manually, or use systemd if available."