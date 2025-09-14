import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import archiver from 'archiver';
import yaml from 'js-yaml';
import handlebars from 'handlebars';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { ServerConfig, Tool, Resource, GeneratedCode } from './types';
import MCPGateway from './mcpGateway';
import DeploymentService from './deploymentService';
import StorageService from './storageService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize services
const mcpGateway = new MCPGateway();
const deploymentService = new DeploymentService();
const storageService = new StorageService();

// Initialize storage
storageService.init().catch(console.error);

// Setup gateway event handlers
mcpGateway.on('server:connected', (server) => {
  console.log(`MCP Server connected: ${server.name} (${server.id})`);
});

mcpGateway.on('server:disconnected', (server) => {
  console.log(`MCP Server disconnected: ${server.name} (${server.id})`);
});

mcpGateway.on('server:error', (server, error) => {
  console.error(`MCP Server error: ${server.name} (${server.id}):`, error);
});

mcpGateway.on('tool:executed', (execution) => {
  console.log(`Tool executed: ${execution.toolName} on ${execution.serverId} (${execution.duration}ms)`);
});

// Setup deployment service event handlers
deploymentService.on('deployment:started', (deployment) => {
  console.log(`Deployment started: ${deployment.id}`);
});

deploymentService.on('deployment:completed', (deployment) => {
  console.log(`Deployment completed: ${deployment.id} - ${deployment.endpoint}`);
});

deploymentService.on('deployment:failed', (deployment, error) => {
  console.error(`Deployment failed: ${deployment.id} - ${error.message}`);
});

deploymentService.on('deployment:stopped', (deployment) => {
  console.log(`Deployment stopped: ${deployment.id}`);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Generate code endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { serverConfig, tools, resources } = req.body;

    if (!serverConfig || !tools) {
      return res.status(400).json({
        error: 'Missing required fields: serverConfig and tools'
      });
    }

    // Validate server configuration
    const validation = validateServerConfig(serverConfig, tools, resources || []);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors
      });
    }

    // Generate code
    const generatedCode = generateCode(serverConfig, tools, resources || []);

    res.json({
      success: true,
      data: generatedCode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Download generated code as ZIP
app.post('/api/download', async (req, res) => {
  try {
    const { serverConfig, tools, resources, generatedCode } = req.body;

    if (!generatedCode) {
      return res.status(400).json({
        error: 'Generated code is required'
      });
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${serverConfig.name}.zip"`);

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Handle archive events
    archive.on('error', (err: Error) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Archive creation failed' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    archive.append(generatedCode.mainPy, { name: 'main.py' });
    archive.append(generatedCode.requirements, { name: 'requirements.txt' });
    archive.append(generatedCode.dockerfile, { name: 'Dockerfile' });
    archive.append(generatedCode.dockerCompose, { name: 'docker-compose.yml' });
    archive.append(generatedCode.readme, { name: 'README.md' });
    archive.append(generatedCode.envExample, { name: '.env.example' });
    archive.append(generatedCode.tests, { name: 'test_server.py' });

    // Add configuration files
    const packageJson = {
      name: serverConfig.name,
      version: serverConfig.version,
      description: serverConfig.description,
      author: serverConfig.author,
      main: "main.py",
      scripts: {
        start: "python main.py",
        test: "python -m pytest test_server.py -v",
        docker: "docker build -t " + serverConfig.name + " .",
        "docker-run": "docker run -p 8000:8000 " + serverConfig.name
      }
    };
    archive.append(JSON.stringify(packageJson, null, 2), { name: 'package.json' });

    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate server configuration
app.post('/api/validate', (req, res) => {
  try {
    const { serverConfig, tools, resources } = req.body;

    const validation = validateServerConfig(serverConfig, tools, resources || []);

    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get tool templates
app.get('/api/templates', (req, res) => {
  try {
    const templates = getToolTemplates();
    res.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      error: 'Failed to load templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Deploy MCP server
app.post('/api/deploy', async (req, res) => {
  try {
    const { serverConfig, generatedCode, deploymentConfig } = req.body;

    if (!generatedCode || !deploymentConfig) {
      return res.status(400).json({
        error: 'Generated code and deployment configuration are required'
      });
    }

    // Start deployment
    const deployment = await deploymentService.deploy(serverConfig, generatedCode, deploymentConfig);

    res.json({
      success: true,
      data: {
        deploymentId: deployment.id,
        status: deployment.status,
        endpoint: deployment.endpoint,
        progress: deployment.progress,
        logs: deployment.logs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      error: 'Deployment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get deployment status
app.get('/api/deploy/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = deploymentService.getDeployment(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment not found'
      });
    }

    res.json({
      success: true,
      data: deployment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({
      error: 'Failed to get deployment status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop deployment
app.post('/api/deploy/:deploymentId/stop', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    await deploymentService.stopDeployment(deploymentId);

    res.json({
      success: true,
      message: 'Deployment stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stop deployment error:', error);
    res.status(500).json({
      error: 'Failed to stop deployment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all deployments
app.get('/api/deployments', (req, res) => {
  try {
    const deployments = deploymentService.getAllDeployments();

    res.json({
      success: true,
      data: deployments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    res.status(500).json({
      error: 'Failed to get deployments',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP Gateway API Endpoints

// Get all MCP servers
app.get('/api/mcp/servers', (req, res) => {
  try {
    const servers = mcpGateway.getServers();
    res.json({
      success: true,
      data: servers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({
      error: 'Failed to get servers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register a new MCP server
app.post('/api/mcp/servers', async (req, res) => {
  try {
    const { id, name, description, config } = req.body;

    if (!id || !name || !config) {
      return res.status(400).json({
        error: 'Missing required fields: id, name, config'
      });
    }

    const server = await mcpGateway.registerServer({
      id,
      name,
      description: description || '',
      ...config
    });

    res.json({
      success: true,
      data: server,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Register server error:', error);
    res.status(500).json({
      error: 'Failed to register server',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Connect to an MCP server
app.post('/api/mcp/servers/:serverId/connect', async (req, res) => {
  try {
    const { serverId } = req.params;
    await mcpGateway.connectServer(serverId);

    res.json({
      success: true,
      message: 'Server connected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connect server error:', error);
    res.status(500).json({
      error: 'Failed to connect to server',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Disconnect from an MCP server
app.post('/api/mcp/servers/:serverId/disconnect', async (req, res) => {
  try {
    const { serverId } = req.params;
    await mcpGateway.disconnectServer(serverId);

    res.json({
      success: true,
      message: 'Server disconnected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Disconnect server error:', error);
    res.status(500).json({
      error: 'Failed to disconnect from server',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute a tool on an MCP server
app.post('/api/mcp/servers/:serverId/tools/:toolName/execute', async (req, res) => {
  try {
    const { serverId, toolName } = req.params;
    const { parameters } = req.body;

    const execution = await mcpGateway.executeTool(serverId, toolName, parameters || {});

    res.json({
      success: true,
      data: execution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Execute tool error:', error);
    res.status(500).json({
      error: 'Failed to execute tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all tools across all servers
app.get('/api/mcp/tools', (req, res) => {
  try {
    const tools = mcpGateway.getAllTools();
    res.json({
      success: true,
      data: tools,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({
      error: 'Failed to get tools',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all resources across all servers
app.get('/api/mcp/resources', (req, res) => {
  try {
    const resources = mcpGateway.getAllResources();
    res.json({
      success: true,
      data: resources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      error: 'Failed to get resources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get MCP Gateway health status
app.get('/api/mcp/health', (req, res) => {
  try {
    const health = mcpGateway.getHealthStatus();
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Gateway health error:', error);
    res.status(500).json({
      error: 'Failed to get gateway health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Project Storage Endpoints

// Save a project
app.post('/api/projects', async (req, res) => {
  try {
    const { serverConfig, tools, resources, projectId } = req.body;

    if (!serverConfig || !tools) {
      return res.status(400).json({
        error: 'Missing required fields: serverConfig and tools'
      });
    }

    const id = await storageService.saveProject(
      serverConfig,
      tools,
      resources || [],
      projectId
    );

    res.json({
      success: true,
      data: { projectId: id },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({
      error: 'Failed to save project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Load a project
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await storageService.loadProject(projectId);

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Load project error:', error);
    res.status(500).json({
      error: 'Failed to load project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const { search, limit } = req.query;
    let projects;

    if (search) {
      projects = await storageService.searchProjects(search as string);
    } else {
      projects = await storageService.getRecentProjects(
        limit ? parseInt(limit as string) : 10
      );
    }

    res.json({
      success: true,
      data: projects,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to get projects',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a project
app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const deleted = await storageService.deleteProject(projectId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Auto-save current session
app.post('/api/projects/auto-save', async (req, res) => {
  try {
    const { serverConfig, tools, resources } = req.body;

    if (!serverConfig || !tools) {
      return res.status(400).json({
        error: 'Missing required fields: serverConfig and tools'
      });
    }

    await storageService.autoSave(serverConfig, tools, resources || []);

    res.json({
      success: true,
      message: 'Auto-saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auto-save error:', error);
    res.status(500).json({
      error: 'Failed to auto-save',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Load auto-saved session
app.get('/api/projects/auto-save', async (req, res) => {
  try {
    const project = await storageService.loadAutoSave();

    res.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Load auto-save error:', error);
    res.status(500).json({
      error: 'Failed to load auto-save',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Docker Integration Endpoints

// Get Docker container logs
app.get('/api/deploy/:deploymentId/logs', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { lines = 100 } = req.query;

    const deployment = deploymentService.getDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment not found'
      });
    }

    if (!deployment.containerId) {
      return res.status(400).json({
        error: 'No container ID found for this deployment'
      });
    }

    const logs = await deploymentService.getContainerLogs(deployment.containerId, Number(lines));

    res.json({
      success: true,
      data: {
        logs,
        containerId: deployment.containerId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get container logs error:', error);
    res.status(500).json({
      error: 'Failed to get container logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute command in Docker container
app.post('/api/deploy/:deploymentId/exec', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Command is required'
      });
    }

    const deployment = deploymentService.getDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment not found'
      });
    }

    if (!deployment.containerId) {
      return res.status(400).json({
        error: 'No container ID found for this deployment'
      });
    }

    const result = await deploymentService.execInContainer(deployment.containerId, command);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({
      error: 'Failed to execute command',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(port, () => {
  console.log(`MCP GUI Builder API server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Helper functions
function validateServerConfig(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!serverConfig.name || !serverConfig.name.trim()) {
    errors.push('Server name is required');
  }

  if (!serverConfig.version || !/^\d+\.\d+\.\d+$/.test(serverConfig.version)) {
    errors.push('Valid semantic version is required (e.g., 1.0.0)');
  }

  if (!tools || tools.length === 0) {
    errors.push('At least one tool is required');
  }

  // Validate tools
  tools.forEach((tool, index) => {
    if (!tool.name || !tool.name.trim()) {
      errors.push(`Tool ${index + 1}: Name is required`);
    }

    if (!tool.description || !tool.description.trim()) {
      errors.push(`Tool ${index + 1}: Description is required`);
    }

    if (!tool.parameters || tool.parameters.length === 0) {
      warnings.push(`Tool "${tool.name}": No parameters defined`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function generateCode(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]): GeneratedCode {
  // This would use the same generation logic as the frontend
  // For now, return a simplified version
  const validTools = tools.filter(tool => tool.isValid);

  return {
    mainPy: generateMainPy(serverConfig, validTools, resources),
    requirements: generateRequirements(serverConfig, validTools),
    dockerfile: generateDockerfile(serverConfig),
    dockerCompose: generateDockerCompose(serverConfig),
    readme: generateReadme(serverConfig, validTools, resources),
    envExample: generateEnvExample(serverConfig),
    tests: generateTests(serverConfig, validTools, resources)
  };
}

function generateMainPy(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]): string {
  const toolFunctions = tools.map(tool => {
    const functionName = sanitizePythonIdentifier(tool.name);
    return `
@mcp.tool()
def ${functionName}(${tool.parameters.map(p => `${p.name}: ${getTypeHint(p.type)}`).join(', ')}) -> str:
    """${tool.description}"""
    # TODO: Implement tool logic
    return f"Tool ${tool.name} executed successfully"
`;
  }).join('\n');

  return `#!/usr/bin/env python3
"""
${serverConfig.name} - ${serverConfig.description}
Generated by MCP GUI Builder
"""

import asyncio
import logging
from fastmcp import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("${serverConfig.name}")

# Create MCP server instance
mcp = FastMCP("${serverConfig.name}")

${toolFunctions}

def main():
    """Main server entry point."""
    logger.info("Starting ${serverConfig.name}...")
    try:
        # Run the server with asyncio
        mcp.run()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise

if __name__ == "__main__":
    main()
`;
}

function generateRequirements(serverConfig: ServerConfig, tools: Tool[]): string {
  const deps = ['fastmcp>=0.1.0'];
  return deps.join('\n');
}

function generateDockerfile(serverConfig: ServerConfig): string {
  return `FROM python:${serverConfig.pythonVersion}-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
`;
}

function generateDockerCompose(serverConfig: ServerConfig): string {
  return `version: '3.8'
services:
  ${serverConfig.name}:
    build: .
    ports:
      - "8000:8000"
    restart: unless-stopped
`;
}

function generateReadme(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]): string {
  return `# ${serverConfig.name}

${serverConfig.description}

Generated by MCP GUI Builder

## Installation

\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`

## Tools

${tools.map(tool => `- **${tool.name}**: ${tool.description}`).join('\n')}
`;
}

function generateEnvExample(serverConfig: ServerConfig): string {
  return Object.entries(serverConfig.environment).map(([key, env]) =>
    `# ${env.description}\n${key}=${env.value || ''}`
  ).join('\n\n');
}

function generateTests(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]): string {
  return `import unittest
from main import *

class TestMCPServer(unittest.TestCase):
    def test_server_health(self):
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()
`;
}

function getTypeHint(type: string): string {
  switch (type) {
    case 'string': return 'str';
    case 'number': return 'float';
    case 'boolean': return 'bool';
    default: return 'str';
  }
}

function getToolTemplates() {
  // Return the same templates as frontend
  return [];
}

function sanitizePythonIdentifier(name: string): string {
  // Convert to snake_case and remove invalid characters
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[0-9]/, '_$&') // Prefix with underscore if starts with number
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    || 'tool'; // Fallback if empty
}

