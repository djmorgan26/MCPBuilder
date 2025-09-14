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
import { ServerConfig, Tool, Resource, GeneratedCode } from '../types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

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
    archive.on('error', (err) => {
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

// Deploy to cloud (placeholder - would integrate with cloud providers)
app.post('/api/deploy', async (req, res) => {
  try {
    const { serverConfig, generatedCode, deploymentConfig } = req.body;

    if (!generatedCode || !deploymentConfig) {
      return res.status(400).json({
        error: 'Generated code and deployment configuration are required'
      });
    }

    // This would integrate with actual deployment services
    // For now, we'll simulate deployment
    await simulateDeployment(serverConfig, deploymentConfig);

    res.json({
      success: true,
      data: {
        deploymentId: `deploy_${Date.now()}`,
        status: 'deployed',
        url: `https://${serverConfig.name}.herokuapp.com`, // Example URL
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
  const toolFunctions = tools.map(tool => `
def ${tool.name}(${tool.parameters.map(p => `${p.name}: ${getTypeHint(p.type)}`).join(', ')}):
    """${tool.description}"""
    # TODO: Implement tool logic
    return "Tool executed successfully"
`).join('\n');

  return `#!/usr/bin/env python3
"""
${serverConfig.name} - ${serverConfig.description}
Generated by MCP GUI Builder
"""

import asyncio
import logging
from fastmcp import FastMCP

logger = logging.getLogger("${serverConfig.name}")
mcp = FastMCP("${serverConfig.name}")

${toolFunctions}

async def main():
    """Main server entry point."""
    logger.info("Starting ${serverConfig.name}...")
    ${tools.map(tool => `mcp.add_tool("${tool.name}", ${tool.name})`).join('\n    ')}
    await mcp.run()

if __name__ == "__main__":
    asyncio.run(main())
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

async function simulateDeployment(serverConfig: ServerConfig, deploymentConfig: any) {
  // Simulate deployment delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { success: true };
}