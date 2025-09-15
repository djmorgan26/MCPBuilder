"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentService = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const uuid_1 = require("uuid");
class DeploymentService extends events_1.EventEmitter {
    constructor() {
        super();
        this.deployments = new Map();
        this.processes = new Map();
        this.tempDirs = new Set();
    }
    async deploy(serverConfig, generatedCode, deploymentConfig) {
        const deploymentId = (0, uuid_1.v4)();
        const deployment = {
            id: deploymentId,
            status: 'pending',
            progress: 0,
            logs: [],
            startTime: new Date()
        };
        this.deployments.set(deploymentId, deployment);
        this.emit('deployment:started', deployment);
        try {
            switch (deploymentConfig.target) {
                case 'docker':
                    await this.deployToDocker(deployment, serverConfig, generatedCode, deploymentConfig.dockerConfig);
                    break;
                case 'local':
                    await this.deployLocal(deployment, serverConfig, generatedCode);
                    break;
                case 'cloud':
                    await this.deployToCloud(deployment, serverConfig, generatedCode, deploymentConfig.cloudConfig);
                    break;
                default:
                    throw new Error(`Unsupported deployment target: ${deploymentConfig.target}`);
            }
            if (deployment.status !== 'completed') {
                deployment.status = 'running';
            }
            deployment.progress = 100;
            deployment.endTime = new Date();
            this.emit('deployment:completed', deployment);
        }
        catch (error) {
            deployment.status = 'failed';
            deployment.error = error instanceof Error ? error.message : String(error);
            deployment.endTime = new Date();
            this.addLog(deployment, `Deployment failed: ${deployment.error}`);
            this.emit('deployment:failed', deployment, error);
        }
        return deployment;
    }
    async deployToDocker(deployment, serverConfig, generatedCode, dockerConfig) {
        deployment.status = 'building';
        this.addLog(deployment, 'Starting Docker deployment...');
        const tempDir = await fs_1.promises.mkdtemp(path.join(os.tmpdir(), 'mcp-build-'));
        this.tempDirs.add(tempDir);
        try {
            await this.writeFilesToDirectory(tempDir, generatedCode);
            this.addLog(deployment, 'Build context prepared');
            deployment.progress = 20;
            await this.buildDockerImage(deployment, tempDir, dockerConfig);
            deployment.progress = 60;
            await this.runDockerContainer(deployment, serverConfig, dockerConfig);
            deployment.progress = 80;
            deployment.endpoint = `docker:${serverConfig.name}`;
            deployment.mcpConfig = {
                id: `docker-${serverConfig.name}`,
                name: serverConfig.name,
                description: serverConfig.description,
                config: {
                    command: 'docker',
                    args: ['run', '-i', '--rm', dockerConfig.imageName],
                    transport: { type: 'stdio' }
                }
            };
            await this.verifyDockerDeployment(deployment, dockerConfig);
            deployment.progress = 100;
            this.addLog(deployment, 'Docker deployment completed successfully');
        }
        finally {
            await this.cleanupTempDir(tempDir);
        }
    }
    async deployLocal(deployment, serverConfig, generatedCode) {
        deployment.status = 'deploying';
        this.addLog(deployment, 'Starting local deployment...');
        const deployDir = path.join(os.homedir(), '.mcp-servers', serverConfig.name);
        await fs_1.promises.mkdir(deployDir, { recursive: true });
        try {
            await this.writeFilesToDirectory(deployDir, generatedCode);
            this.addLog(deployment, 'Files written to deployment directory');
            deployment.progress = 30;
            await this.installDependencies(deployment, deployDir);
            deployment.progress = 60;
            await this.startLocalServer(deployment, deployDir, serverConfig);
            deployment.progress = 100;
            deployment.endpoint = `stdio:${path.join(deployDir, 'main.py')}`;
            this.addLog(deployment, `Local deployment completed. Endpoint: ${deployment.endpoint}`);
        }
        catch (error) {
            this.addLog(deployment, `Local deployment failed: ${error}`);
            throw error;
        }
    }
    async deployToCloud(deployment, serverConfig, generatedCode, cloudConfig) {
        deployment.status = 'deploying';
        this.addLog(deployment, `Starting ${cloudConfig.provider} deployment...`);
        throw new Error(`Cloud deployment to ${cloudConfig.provider} is not yet implemented`);
    }
    async writeFilesToDirectory(dir, generatedCode) {
        const files = {
            'main.py': generatedCode.mainPy,
            'requirements.txt': generatedCode.requirements,
            'Dockerfile': generatedCode.dockerfile,
            'docker-compose.yml': generatedCode.dockerCompose,
            'README.md': generatedCode.readme,
            '.env.example': generatedCode.envExample,
            'test_server.py': generatedCode.tests
        };
        for (const [filename, content] of Object.entries(files)) {
            await fs_1.promises.writeFile(path.join(dir, filename), content, 'utf-8');
        }
    }
    async buildDockerImage(deployment, buildDir, dockerConfig) {
        this.addLog(deployment, `Building Docker image: ${dockerConfig.imageName}:${dockerConfig.tag}`);
        return new Promise((resolve, reject) => {
            const buildProcess = (0, child_process_1.spawn)('docker', [
                'build',
                '-t', `${dockerConfig.imageName}:${dockerConfig.tag}`,
                '.'
            ], {
                cwd: buildDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            buildProcess.stdout.on('data', (data) => {
                this.addLog(deployment, data.toString().trim());
            });
            buildProcess.stderr.on('data', (data) => {
                this.addLog(deployment, `[STDERR] ${data.toString().trim()}`);
            });
            buildProcess.on('close', (code) => {
                if (code === 0) {
                    this.addLog(deployment, 'Docker image built successfully');
                    resolve();
                }
                else {
                    reject(new Error(`Docker build failed with exit code ${code}`));
                }
            });
            buildProcess.on('error', (error) => {
                reject(new Error(`Docker build error: ${error.message}`));
            });
        });
    }
    async runDockerContainer(deployment, serverConfig, dockerConfig) {
        this.addLog(deployment, 'Starting Docker container...');
        const containerName = `${dockerConfig.imageName}-${Date.now()}`;
        const dockerArgs = [
            'run',
            '-d',
            '--name', containerName,
            '-p', `${dockerConfig.exposePort}:${dockerConfig.exposePort}`
        ];
        for (const [key, envVar] of Object.entries(serverConfig.environment)) {
            if (envVar.value) {
                dockerArgs.push('-e', `${key}=${envVar.value}`);
            }
        }
        if (dockerConfig.volumes) {
            for (const volume of dockerConfig.volumes) {
                dockerArgs.push('-v', volume);
            }
        }
        dockerArgs.push(`${dockerConfig.imageName}:${dockerConfig.tag}`);
        return new Promise((resolve, reject) => {
            const runProcess = (0, child_process_1.spawn)('docker', dockerArgs, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            runProcess.stdout.on('data', (data) => {
                const output = data.toString().trim();
                deployment.containerId = output;
                this.addLog(deployment, `Container started with ID: ${output}`);
            });
            runProcess.stderr.on('data', (data) => {
                this.addLog(deployment, `[STDERR] ${data.toString().trim()}`);
            });
            runProcess.on('close', (code) => {
                if (code === 0) {
                    deployment.endpoint = `http://localhost:${dockerConfig.exposePort}`;
                    resolve();
                }
                else {
                    reject(new Error(`Docker run failed with exit code ${code}`));
                }
            });
            runProcess.on('error', (error) => {
                reject(new Error(`Docker run error: ${error.message}`));
            });
        });
    }
    async verifyDockerDeployment(deployment, dockerConfig) {
        this.addLog(deployment, 'Verifying deployment...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return new Promise((resolve, reject) => {
            const logsProcess = (0, child_process_1.spawn)('docker', ['logs', deployment.containerId], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let output = '';
            logsProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            logsProcess.stderr.on('data', (data) => {
                output += data.toString();
            });
            logsProcess.on('close', (code) => {
                this.addLog(deployment, `Container logs output: ${output}`);
                if (output.includes('Starting MCP server') ||
                    output.includes('FastMCP') ||
                    output.includes('Starting my-mcp-server') ||
                    (output.includes('server') && !output.includes('SyntaxError') && !output.includes('Error:'))) {
                    this.addLog(deployment, 'MCP server started successfully!');
                    deployment.status = 'completed';
                    resolve();
                }
                else if (output.includes('SyntaxError') || output.includes('Error:')) {
                    this.addLog(deployment, `Deployment failed: ${output.split('\n').find(line => line.includes('Error') || line.includes('SyntaxError')) || 'Unknown error'}`);
                    reject(new Error('Container failed to start properly'));
                }
                else {
                    this.addLog(deployment, 'No success indicators found, checking container status...');
                    this.checkContainerRunning(deployment, resolve, reject);
                }
            });
        });
    }
    checkContainerRunning(deployment, resolve, reject) {
        const checkProcess = (0, child_process_1.spawn)('docker', ['ps', '--filter', `name=${deployment.containerId}`, '--format', 'table {{.Names}}\t{{.Status}}'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        checkProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Up')) {
                this.addLog(deployment, 'Container is running successfully');
                deployment.status = 'completed';
                resolve();
            }
            else {
                this.addLog(deployment, 'Container started but exited (normal for STDIO MCP servers)');
                deployment.status = 'completed';
                resolve();
            }
        });
        checkProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error('Failed to verify container status'));
            }
        });
    }
    async installDependencies(deployment, deployDir) {
        this.addLog(deployment, 'Installing Python dependencies...');
        return new Promise((resolve, reject) => {
            const installProcess = (0, child_process_1.spawn)('pip', ['install', '-r', 'requirements.txt'], {
                cwd: deployDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            installProcess.stdout.on('data', (data) => {
                this.addLog(deployment, data.toString().trim());
            });
            installProcess.stderr.on('data', (data) => {
                this.addLog(deployment, `[STDERR] ${data.toString().trim()}`);
            });
            installProcess.on('close', (code) => {
                if (code === 0) {
                    this.addLog(deployment, 'Dependencies installed successfully');
                    resolve();
                }
                else {
                    reject(new Error(`Dependency installation failed with exit code ${code}`));
                }
            });
            installProcess.on('error', (error) => {
                reject(new Error(`Dependency installation error: ${error.message}`));
            });
        });
    }
    async startLocalServer(deployment, deployDir, serverConfig) {
        this.addLog(deployment, 'Starting local MCP server...');
        const serverProcess = (0, child_process_1.spawn)('python', ['main.py'], {
            cwd: deployDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                ...Object.fromEntries(Object.entries(serverConfig.environment).map(([key, envVar]) => [key, envVar.value || '']))
            }
        });
        this.processes.set(deployment.id, serverProcess);
        serverProcess.stdout.on('data', (data) => {
            this.addLog(deployment, `[SERVER] ${data.toString().trim()}`);
        });
        serverProcess.stderr.on('data', (data) => {
            this.addLog(deployment, `[SERVER ERROR] ${data.toString().trim()}`);
        });
        serverProcess.on('close', (code) => {
            this.addLog(deployment, `Server process exited with code ${code}`);
            if (deployment.status === 'running') {
                deployment.status = 'stopped';
                this.emit('deployment:stopped', deployment);
            }
        });
        serverProcess.on('error', (error) => {
            this.addLog(deployment, `Server process error: ${error.message}`);
            if (deployment.status === 'running') {
                deployment.status = 'failed';
                deployment.error = error.message;
                this.emit('deployment:failed', deployment, error);
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.addLog(deployment, 'Local server started');
    }
    async stopDeployment(deploymentId) {
        const deployment = this.deployments.get(deploymentId);
        if (!deployment) {
            throw new Error(`Deployment ${deploymentId} not found`);
        }
        this.addLog(deployment, 'Stopping deployment...');
        const process = this.processes.get(deploymentId);
        if (process) {
            process.kill('SIGTERM');
            this.processes.delete(deploymentId);
        }
        if (deployment.containerId) {
            await this.stopDockerContainer(deployment.containerId);
        }
        deployment.status = 'stopped';
        deployment.endTime = new Date();
        this.addLog(deployment, 'Deployment stopped');
        this.emit('deployment:stopped', deployment);
    }
    async stopDockerContainer(containerId) {
        return new Promise((resolve) => {
            const stopProcess = (0, child_process_1.spawn)('docker', ['stop', containerId], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            stopProcess.on('close', () => {
                (0, child_process_1.spawn)('docker', ['rm', containerId], { stdio: 'ignore' });
                resolve();
            });
            stopProcess.on('error', () => {
                resolve();
            });
        });
    }
    getDeployment(deploymentId) {
        return this.deployments.get(deploymentId);
    }
    getAllDeployments() {
        return Array.from(this.deployments.values());
    }
    addLog(deployment, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        deployment.logs.push(logEntry);
        this.emit('deployment:log', deployment, logEntry);
    }
    async cleanupTempDir(tempDir) {
        try {
            await fs_1.promises.rm(tempDir, { recursive: true, force: true });
            this.tempDirs.delete(tempDir);
        }
        catch (error) {
            console.error(`Failed to cleanup temp directory ${tempDir}:`, error);
        }
    }
    async getContainerLogs(containerId, lines = 100) {
        return new Promise((resolve, reject) => {
            const logsProcess = (0, child_process_1.spawn)('docker', ['logs', '--tail', lines.toString(), containerId], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let output = '';
            let errorOutput = '';
            logsProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            logsProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            logsProcess.on('close', (code) => {
                if (code === 0) {
                    const logs = (output + errorOutput).split('\n').filter(line => line.trim());
                    resolve(logs);
                }
                else {
                    reject(new Error(`Failed to get container logs: ${errorOutput}`));
                }
            });
            logsProcess.on('error', (error) => {
                reject(new Error(`Docker logs error: ${error.message}`));
            });
        });
    }
    async execInContainer(containerId, command) {
        return new Promise((resolve, reject) => {
            const execProcess = (0, child_process_1.spawn)('docker', ['exec', containerId, 'sh', '-c', command], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            execProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            execProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            execProcess.on('close', (code) => {
                resolve({
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: code || 0
                });
            });
            execProcess.on('error', (error) => {
                reject(new Error(`Docker exec error: ${error.message}`));
            });
        });
    }
    async getContainerStatus(containerId) {
        return new Promise((resolve, reject) => {
            const statusProcess = (0, child_process_1.spawn)('docker', ['inspect', '--format', '{{.State.Status}}{{if .State.Health}} {{.State.Health.Status}}{{end}}', containerId], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let output = '';
            statusProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            statusProcess.on('close', (code) => {
                if (code === 0) {
                    const parts = output.trim().split(' ');
                    resolve({
                        status: parts[0],
                        health: parts[1] || undefined
                    });
                }
                else {
                    reject(new Error('Failed to get container status'));
                }
            });
            statusProcess.on('error', (error) => {
                reject(new Error(`Docker inspect error: ${error.message}`));
            });
        });
    }
    async cleanup() {
        for (const [deploymentId] of this.processes) {
            await this.stopDeployment(deploymentId);
        }
        for (const tempDir of this.tempDirs) {
            await this.cleanupTempDir(tempDir);
        }
    }
}
exports.DeploymentService = DeploymentService;
exports.default = DeploymentService;
//# sourceMappingURL=deploymentService.js.map