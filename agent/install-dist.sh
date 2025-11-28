#!/bin/bash

# Distributed Agent Installation Script

echo "Installing Distributed Agent..."

# Check if we're running on Linux
if [[ "$OSTYPE" != "linux"* ]]; then
    echo "Warning: This script is intended for Linux systems."
fi

# Install Node.js if not present (using NodeSource)
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    
    # Check distribution
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "Unsupported package manager. Please install Node.js manually."
        exit 1
    fi
else
    echo "Node.js already installed: $(node --version)"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create systemd service file (optional)
read -p "Do you want to create a systemd service for the agent? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_NAME="aiops-dist-agent"
    SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
    
    if [ "$EUID" -ne 0 ]; then
        echo "Please run as root to create systemd service:"
        echo "sudo $0"
        exit 1
    fi
    
    # Get the current user
    AGENT_USER=$(logname 2>/dev/null || whoami)
    
    # Create service file
    cat > $SERVICE_FILE << EOF
[Unit]
Description=AI-Ops Distributed Agent
After=network.target

[Service]
Type=simple
User=$AGENT_USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) dist-agent.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    echo "Systemd service created: $SERVICE_FILE"
    echo "To start the service: sudo systemctl start $SERVICE_NAME"
    echo "To check status: sudo systemctl status $SERVICE_NAME"
fi

echo "Installation complete!"
echo "To start the agent: npm run start:dist"