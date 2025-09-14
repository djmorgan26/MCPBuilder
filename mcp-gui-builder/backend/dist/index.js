"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const multer_1 = __importDefault(require("multer"));
const archiver_1 = __importDefault(require("archiver"));
const dotenv_1 = __importDefault(require("dotenv"));
const mcpGateway_1 = __importDefault(require("./mcpGateway"));
const deploymentService_1 = __importDefault(require("./deploymentService"));
const storageService_1 = __importDefault(require("./storageService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const mcpGateway = new mcpGateway_1.default();
const deploymentService = new deploymentService_1.default();
const storageService = new storageService_1.default();
storageService.init().catch(console.error);
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
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const upload = (0, multer_1.default)({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.post('/api/generate', async (req, res) => {
    try {
        const { serverConfig, tools, resources } = req.body;
        if (!serverConfig || !tools) {
            return res.status(400).json({
                error: 'Missing required fields: serverConfig and tools'
            });
        }
        const validation = validateServerConfig(serverConfig, tools, resources || []);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                errors: validation.errors
            });
        }
        const generatedCode = generateCode(serverConfig, tools, resources || []);
        res.json({
            success: true,
            data: generatedCode,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Code generation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/download', async (req, res) => {
    try {
        const { serverConfig, tools, resources, generatedCode } = req.body;
        if (!generatedCode) {
            return res.status(400).json({
                error: 'Generated code is required'
            });
        }
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${serverConfig.name}.zip"`);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Archive creation failed' });
        });
        archive.pipe(res);
        archive.append(generatedCode.mainPy, { name: 'main.py' });
        archive.append(generatedCode.requirements, { name: 'requirements.txt' });
        archive.append(generatedCode.dockerfile, { name: 'Dockerfile' });
        archive.append(generatedCode.dockerCompose, { name: 'docker-compose.yml' });
        archive.append(generatedCode.readme, { name: 'README.md' });
        archive.append(generatedCode.envExample, { name: '.env.example' });
        archive.append(generatedCode.tests, { name: 'test_server.py' });
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
        await archive.finalize();
    }
    catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            error: 'Download failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/validate', (req, res) => {
    try {
        const { serverConfig, tools, resources } = req.body;
        const validation = validateServerConfig(serverConfig, tools, resources || []);
        res.json({
            success: true,
            data: validation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            error: 'Validation failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/templates', (req, res) => {
    try {
        const templates = getToolTemplates();
        res.json({
            success: true,
            data: templates,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Templates error:', error);
        res.status(500).json({
            error: 'Failed to load templates',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/deploy', async (req, res) => {
    try {
        const { serverConfig, generatedCode, deploymentConfig } = req.body;
        if (!generatedCode || !deploymentConfig) {
            return res.status(400).json({
                error: 'Generated code and deployment configuration are required'
            });
        }
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
    }
    catch (error) {
        console.error('Deployment error:', error);
        res.status(500).json({
            error: 'Deployment failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Get deployment error:', error);
        res.status(500).json({
            error: 'Failed to get deployment status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/deploy/:deploymentId/stop', async (req, res) => {
    try {
        const { deploymentId } = req.params;
        await deploymentService.stopDeployment(deploymentId);
        res.json({
            success: true,
            message: 'Deployment stopped',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Stop deployment error:', error);
        res.status(500).json({
            error: 'Failed to stop deployment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/deployments', (req, res) => {
    try {
        const deployments = deploymentService.getAllDeployments();
        res.json({
            success: true,
            data: deployments,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get deployments error:', error);
        res.status(500).json({
            error: 'Failed to get deployments',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/mcp/servers', (req, res) => {
    try {
        const servers = mcpGateway.getServers();
        res.json({
            success: true,
            data: servers,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get servers error:', error);
        res.status(500).json({
            error: 'Failed to get servers',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Register server error:', error);
        res.status(500).json({
            error: 'Failed to register server',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/mcp/servers/:serverId/connect', async (req, res) => {
    try {
        const { serverId } = req.params;
        await mcpGateway.connectServer(serverId);
        res.json({
            success: true,
            message: 'Server connected successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Connect server error:', error);
        res.status(500).json({
            error: 'Failed to connect to server',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/mcp/servers/:serverId/disconnect', async (req, res) => {
    try {
        const { serverId } = req.params;
        await mcpGateway.disconnectServer(serverId);
        res.json({
            success: true,
            message: 'Server disconnected successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Disconnect server error:', error);
        res.status(500).json({
            error: 'Failed to disconnect from server',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Execute tool error:', error);
        res.status(500).json({
            error: 'Failed to execute tool',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/mcp/tools', (req, res) => {
    try {
        const tools = mcpGateway.getAllTools();
        res.json({
            success: true,
            data: tools,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get tools error:', error);
        res.status(500).json({
            error: 'Failed to get tools',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/mcp/resources', (req, res) => {
    try {
        const resources = mcpGateway.getAllResources();
        res.json({
            success: true,
            data: resources,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({
            error: 'Failed to get resources',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/mcp/health', (req, res) => {
    try {
        const health = mcpGateway.getHealthStatus();
        res.json({
            success: true,
            data: health,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Gateway health error:', error);
        res.status(500).json({
            error: 'Failed to get gateway health',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/api/projects', async (req, res) => {
    try {
        const { serverConfig, tools, resources, projectId } = req.body;
        if (!serverConfig || !tools) {
            return res.status(400).json({
                error: 'Missing required fields: serverConfig and tools'
            });
        }
        const id = await storageService.saveProject(serverConfig, tools, resources || [], projectId);
        res.json({
            success: true,
            data: { projectId: id },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Save project error:', error);
        res.status(500).json({
            error: 'Failed to save project',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Load project error:', error);
        res.status(500).json({
            error: 'Failed to load project',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/projects', async (req, res) => {
    try {
        const { search, limit } = req.query;
        let projects;
        if (search) {
            projects = await storageService.searchProjects(search);
        }
        else {
            projects = await storageService.getRecentProjects(limit ? parseInt(limit) : 10);
        }
        res.json({
            success: true,
            data: projects,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            error: 'Failed to get projects',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            error: 'Failed to delete project',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Auto-save error:', error);
        res.status(500).json({
            error: 'Failed to auto-save',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/api/projects/auto-save', async (req, res) => {
    try {
        const project = await storageService.loadAutoSave();
        res.json({
            success: true,
            data: project,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Load auto-save error:', error);
        res.status(500).json({
            error: 'Failed to load auto-save',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Get container logs error:', error);
        res.status(500).json({
            error: 'Failed to get container logs',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
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
    }
    catch (error) {
        console.error('Execute command error:', error);
        res.status(500).json({
            error: 'Failed to execute command',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});
app.listen(port, () => {
    console.log(`MCP GUI Builder API server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
function validateServerConfig(serverConfig, tools, resources) {
    const errors = [];
    const warnings = [];
    if (!serverConfig.name || !serverConfig.name.trim()) {
        errors.push('Server name is required');
    }
    if (!serverConfig.version || !/^\d+\.\d+\.\d+$/.test(serverConfig.version)) {
        errors.push('Valid semantic version is required (e.g., 1.0.0)');
    }
    if (!tools || tools.length === 0) {
        errors.push('At least one tool is required');
    }
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
function generateCode(serverConfig, tools, resources) {
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
function generateMainPy(serverConfig, tools, resources) {
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
function generateRequirements(serverConfig, tools) {
    const deps = ['fastmcp>=0.1.0'];
    return deps.join('\n');
}
function generateDockerfile(serverConfig) {
    return `FROM python:${serverConfig.pythonVersion}-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
`;
}
function generateDockerCompose(serverConfig) {
    return `version: '3.8'
services:
  ${serverConfig.name}:
    build: .
    ports:
      - "8000:8000"
    restart: unless-stopped
`;
}
function generateReadme(serverConfig, tools, resources) {
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
function generateEnvExample(serverConfig) {
    return Object.entries(serverConfig.environment).map(([key, env]) => `# ${env.description}\n${key}=${env.value || ''}`).join('\n\n');
}
function generateTests(serverConfig, tools, resources) {
    return `import unittest
from main import *

class TestMCPServer(unittest.TestCase):
    def test_server_health(self):
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()
`;
}
function getTypeHint(type) {
    switch (type) {
        case 'string': return 'str';
        case 'number': return 'float';
        case 'boolean': return 'bool';
        default: return 'str';
    }
}
function getToolTemplates() {
    return [];
}
function sanitizePythonIdentifier(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^[0-9]/, '_$&')
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_')
        || 'tool';
}
//# sourceMappingURL=index.js.map