# AI Integrated Application Operations Tool (AI-Ops Tool)

This is an application operations tool integrated with AI large models, allowing users to describe problems in natural language and obtain solutions.

## Features

1. AI Large Model Integration - Users can describe operations problems in natural language
2. Intelligent Solution Generation - Provide detailed solutions based on problem descriptions
3. Application Operations Focused - Optimized for common application operations scenarios
4. Knowledge Base Management - Store and manage operations knowledge
5. Component Dependency Management - Manage application components and their dependencies
6. Distributed Agent Management - Manage monitoring agents deployed on different nodes
7. Historical Event Management - Record and analyze historical operations events

## Project Structure

```
aiops-tool/
├── backend/          # Backend services
│   ├── agent/        # Agent management module
│   ├── component/    # Component dependency management module
│   ├── historical-events/  # Historical event management module
│   ├── knowledge/    # Knowledge base management module
│   ├── solution/     # Solution management module
│   └── server.js     # Backend main service
├── frontend/         # Frontend interface
└── README.md
```

## Technology Stack

- Frontend: React + TailwindCSS
- Backend: Node.js + Express
- Databases: PostgreSQL (component dependencies), MongoDB (knowledge base and solutions)
- AI Integration: DeepSeek API
- Containerization: Docker Compose

## Detailed Module Introduction

### Solution Management
- Natural language problem description to solution conversion
- Solution creation, editing, and deletion
- Conversion from knowledge base entries to solutions

### Knowledge Base Management
- CRUD operations for operations knowledge
- Vectorized storage of knowledge entries
- Integration with solutions

### Component Dependency Management
- Visualization of components and their dependencies
- Manual addition of component dependencies
- Batch import of component dependencies via Excel
- Component dependency graph display

### Distributed Agent Management
- Agent registration and status monitoring
- CRUD operations for agents

### Historical Event Management
- Recording and querying of operations events
- Statistical analysis of historical events
- Excel import of historical events (with deduplication support)

## Quick Start

1. Start infrastructure services:
   ```bash
   ./start-postgresql.sh
   ./start-mongodb.sh
   ./start-qdrant.sh
   ```

2. Start backend service:
   ```bash
   cd backend
   npm install
   node server.js
   ```

3. Start frontend service:
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. Access the application:
   Frontend: http://localhost:3002
   Backend API: http://localhost:3001

## Deployment

Refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file for detailed deployment instructions.