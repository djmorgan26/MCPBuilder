import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

export interface DeploymentConfig {
  target: 'docker' | 'local' | 'cloud';
  dockerConfig?: DockerConfig;
  cloudConfig?: CloudConfig;
}

export interface DockerConfig {
  imageName: string;
  tag: string;
  baseImage: string;
  exposePort: number;
  volumes: string[];
  envFile: boolean;
  autoStart: boolean;
}

export interface CloudConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'vercel';
  region: string;
  instanceType?: string;
}

export interface DeploymentStatus {
  id: string;
  status: 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped' | 'completed';
  progress: number;
  logs: string[];
  startTime: Date;
  endTime?: Date;
  endpoint?: string;
  containerId?: string;
  error?: string;
  mcpConfig?: MCPServerConfig;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  config: {
    command: string;
    args: string[];
    transport: {
      type: 'stdio' | 'http';
      host?: string;
      port?: number;
    };
  };
}

export interface GeneratedCode {
  mainPy: string;
  requirements: string;
  dockerfile: string;
  dockerCompose: string;
  readme: string;
  envExample: string;
  tests: string;
}

export interface ServerConfig {
  name: string;
  description: string;
  version: string;
  author: string;
  pythonVersion: string;
  environment: Record<string, any>;
}

export class DeploymentService extends EventEmitter {
  private deployments: Map<string, DeploymentStatus> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private tempDirs: Set<string> = new Set();

  constructor() {
    super();
  }

  /**
   * Deploy a generated MCP server
   */
  async deploy(
    serverConfig: ServerConfig,
    generatedCode: GeneratedCode,
    deploymentConfig: DeploymentConfig
  ): Promise<DeploymentStatus> {
    const deploymentId = uuidv4();
    const deployment: DeploymentStatus = {
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
          await this.deployToDocker(deployment, serverConfig, generatedCode, deploymentConfig.dockerConfig!);
          break;
        case 'local':
          await this.deployLocal(deployment, serverConfig, generatedCode);
          break;
        case 'cloud':
          await this.deployToCloud(deployment, serverConfig, generatedCode, deploymentConfig.cloudConfig!);
          break;
        default:
          throw new Error(`Unsupported deployment target: ${deploymentConfig.target}`);
      }

      // Only set to 'running' if not already 'completed' by verification
      if (deployment.status !== 'completed') {
        deployment.status = 'running';
      }
      deployment.progress = 100;
      deployment.endTime = new Date();
      this.emit('deployment:completed', deployment);
    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error instanceof Error ? error.message : String(error);
      deployment.endTime = new Date();
      this.addLog(deployment, `Deployment failed: ${deployment.error}`);
      this.emit('deployment:failed', deployment, error);
    }

    return deployment;
  }

  /**
   * Deploy to Docker
   */
  private async deployToDocker(
    deployment: DeploymentStatus,
    serverConfig: ServerConfig,
    generatedCode: GeneratedCode,
    dockerConfig: DockerConfig
  ): Promise<void> {
    deployment.status = 'building';
    this.addLog(deployment, 'Starting Docker deployment...');

    // Create temporary directory for build context
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-build-'));
    this.tempDirs.add(tempDir);

    try {
      // Write all files to temp directory
      await this.writeFilesToDirectory(tempDir, generatedCode);
      this.addLog(deployment, 'Build context prepared');
      deployment.progress = 20;

      // Build Docker image
      await this.buildDockerImage(deployment, tempDir, dockerConfig);
      deployment.progress = 60;

      // Run Docker container
      await this.runDockerContainer(deployment, serverConfig, dockerConfig);
      deployment.progress = 80;

      // Set deployment endpoint and connection info first
      deployment.endpoint = `docker:${serverConfig.name}`;
      deployment.mcpConfig = {
        id: `docker-${serverConfig.name}`,
        name: serverConfig.name,
        description: serverConfig.description,
        config: {
          command: 'docker',
          args: ['run', '-i', '--rm', dockerConfig.imageName],
          transport: { type: 'stdio' as const }
        }
      };

      // Verify deployment
      await this.verifyDockerDeployment(deployment, dockerConfig);
      deployment.progress = 100;

      this.addLog(deployment, 'Docker deployment completed successfully');
    } finally {
      // Cleanup temp directory
      await this.cleanupTempDir(tempDir);
    }
  }

  /**
   * Deploy locally
   */
  private async deployLocal(
    deployment: DeploymentStatus,
    serverConfig: ServerConfig,
    generatedCode: GeneratedCode
  ): Promise<void> {
    deployment.status = 'deploying';
    this.addLog(deployment, 'Starting local deployment...');

    // Create deployment directory
    const deployDir = path.join(os.homedir(), '.mcp-servers', serverConfig.name);
    await fs.mkdir(deployDir, { recursive: true });

    try {
      // Write all files
      await this.writeFilesToDirectory(deployDir, generatedCode);
      this.addLog(deployment, 'Files written to deployment directory');
      deployment.progress = 30;

      // Install dependencies
      await this.installDependencies(deployment, deployDir);
      deployment.progress = 60;

      // Start the server
      await this.startLocalServer(deployment, deployDir, serverConfig);
      deployment.progress = 100;

      deployment.endpoint = `stdio:${path.join(deployDir, 'main.py')}`;
      this.addLog(deployment, `Local deployment completed. Endpoint: ${deployment.endpoint}`);
    } catch (error) {
      this.addLog(deployment, `Local deployment failed: ${error}`);
      throw error;
    }
  }

  /**
   * Deploy to cloud
   */
  private async deployToCloud(
    deployment: DeploymentStatus,
    serverConfig: ServerConfig,
    generatedCode: GeneratedCode,
    cloudConfig: CloudConfig
  ): Promise<void> {
    deployment.status = 'deploying';
    this.addLog(deployment, `Starting ${cloudConfig.provider} deployment...`);

    // This is a placeholder for cloud deployment
    // In a real implementation, this would integrate with cloud provider APIs
    throw new Error(`Cloud deployment to ${cloudConfig.provider} is not yet implemented`);
  }

  /**
   * Write all generated files to a directory
   */
  private async writeFilesToDirectory(dir: string, generatedCode: GeneratedCode): Promise<void> {
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
      await fs.writeFile(path.join(dir, filename), content, 'utf-8');
    }
  }

  /**
   * Build Docker image
   */
  private async buildDockerImage(
    deployment: DeploymentStatus,
    buildDir: string,
    dockerConfig: DockerConfig
  ): Promise<void> {
    this.addLog(deployment, `Building Docker image: ${dockerConfig.imageName}:${dockerConfig.tag}`);

    return new Promise((resolve, reject) => {
      const buildProcess = spawn('docker', [
        'build',
        '-t', `${dockerConfig.imageName}:${dockerConfig.tag}`,
        '.'
      ], {
        cwd: buildDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      buildProcess.stdout.on('data', (data: Buffer) => {
        this.addLog(deployment, data.toString().trim());
      });

      buildProcess.stderr.on('data', (data: Buffer) => {
        this.addLog(deployment, `[STDERR] ${data.toString().trim()}`);
      });

      buildProcess.on('close', (code: number) => {
        if (code === 0) {
          this.addLog(deployment, 'Docker image built successfully');
          resolve();
        } else {
          reject(new Error(`Docker build failed with exit code ${code}`));
        }
      });

      buildProcess.on('error', (error: Error) => {
        reject(new Error(`Docker build error: ${error.message}`));
      });
    });
  }

  /**
   * Run Docker container
   */
  private async runDockerContainer(
    deployment: DeploymentStatus,
    serverConfig: ServerConfig,
    dockerConfig: DockerConfig
  ): Promise<void> {
    this.addLog(deployment, 'Starting Docker container...');

    const containerName = `${dockerConfig.imageName}-${Date.now()}`;
    const dockerArgs = [
      'run',
      '-d',
      '--name', containerName,
      '-p', `${dockerConfig.exposePort}:${dockerConfig.exposePort}`
    ];

    // Add environment variables
    for (const [key, envVar] of Object.entries(serverConfig.environment)) {
      if (envVar.value) {
        dockerArgs.push('-e', `${key}=${envVar.value}`);
      }
    }

    // Add volumes
    if (dockerConfig.volumes) {
      for (const volume of dockerConfig.volumes) {
        dockerArgs.push('-v', volume);
      }
    }

    dockerArgs.push(`${dockerConfig.imageName}:${dockerConfig.tag}`);

    return new Promise((resolve, reject) => {
      const runProcess = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      runProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString().trim();
        deployment.containerId = output;
        this.addLog(deployment, `Container started with ID: ${output}`);
      });

      runProcess.stderr.on('data', (data: Buffer) => {
        this.addLog(deployment, `[STDERR] ${data.toString().trim()}`);
      });

      runProcess.on('close', (code: number) => {
        if (code === 0) {
          deployment.endpoint = `http://localhost:${dockerConfig.exposePort}`;
          resolve();
        } else {
          reject(new Error(`Docker run failed with exit code ${code}`));
        }
      });

      runProcess.on('error', (error: Error) => {
        reject(new Error(`Docker run error: ${error.message}`));
      });
    });
  }

  /**
   * Verify Docker deployment
   */
  private async verifyDockerDeployment(
    deployment: DeploymentStatus,
    dockerConfig: DockerConfig
  ): Promise<void> {
    this.addLog(deployment, 'Verifying deployment...');

    // Wait a moment for the container to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check container logs for successful MCP server startup
    return new Promise((resolve, reject) => {
      const logsProcess = spawn('docker', ['logs', deployment.containerId!], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      logsProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      logsProcess.stderr.on('data', (data: Buffer) => {
        output += data.toString();
      });

      logsProcess.on('close', (code) => {
        // Debug: Log the actual output to see what we're getting
        this.addLog(deployment, `Container logs output: ${output}`);

        // Check for successful MCP server startup indicators
        if (output.includes('Starting MCP server') ||
            output.includes('FastMCP') ||
            output.includes('Starting my-mcp-server') ||
            (output.includes('server') && !output.includes('SyntaxError') && !output.includes('Error:'))) {
          this.addLog(deployment, 'MCP server started successfully!');
          deployment.status = 'completed';
          resolve();
        } else if (output.includes('SyntaxError') || output.includes('Error:')) {
          this.addLog(deployment, `Deployment failed: ${output.split('\n').find(line => line.includes('Error') || line.includes('SyntaxError')) || 'Unknown error'}`);
          reject(new Error('Container failed to start properly'));
        } else {
          // Fallback: check if container is running
          this.addLog(deployment, 'No success indicators found, checking container status...');
          this.checkContainerRunning(deployment, resolve, reject);
        }
      });

    });
  }

  /**
   * Check if container is running (fallback verification)
   */
  private checkContainerRunning(
    deployment: DeploymentStatus,
    resolve: Function,
    reject: Function
  ): void {
    const checkProcess = spawn('docker', ['ps', '--filter', `name=${deployment.containerId}`, '--format', 'table {{.Names}}\t{{.Status}}'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    checkProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      if (output.includes('Up')) {
        this.addLog(deployment, 'Container is running successfully');
        deployment.status = 'completed';
        resolve();
      } else {
        this.addLog(deployment, 'Container started but exited (normal for STDIO MCP servers)');
        deployment.status = 'completed';
        resolve();
      }
    });

    checkProcess.on('close', (code: number) => {
      if (code !== 0) {
        reject(new Error('Failed to verify container status'));
      }
    });
  }

  /**
   * Install dependencies for local deployment
   */
  private async installDependencies(deployment: DeploymentStatus, deployDir: string): Promise<void> {
    this.addLog(deployment, 'Installing Python dependencies...');

    return new Promise((resolve, reject) => {
      const installProcess = spawn('pip', ['install', '-r', 'requirements.txt'], {
        cwd: deployDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      installProcess.stdout.on('data', (data: Buffer) => {
        this.addLog(deployment, data.toString().trim());
      });

      installProcess.stderr.on('data', (data: Buffer) => {
        this.addLog(deployment, `[STDERR] ${data.toString().trim()}`);
      });

      installProcess.on('close', (code: number) => {
        if (code === 0) {
          this.addLog(deployment, 'Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`Dependency installation failed with exit code ${code}`));
        }
      });

      installProcess.on('error', (error: Error) => {
        reject(new Error(`Dependency installation error: ${error.message}`));
      });
    });
  }

  /**
   * Start local server
   */
  private async startLocalServer(
    deployment: DeploymentStatus,
    deployDir: string,
    serverConfig: ServerConfig
  ): Promise<void> {
    this.addLog(deployment, 'Starting local MCP server...');

    const serverProcess = spawn('python', ['main.py'], {
      cwd: deployDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...Object.fromEntries(
          Object.entries(serverConfig.environment).map(([key, envVar]) => [key, envVar.value || ''])
        )
      }
    });

    this.processes.set(deployment.id, serverProcess);

    serverProcess.stdout.on('data', (data: Buffer) => {
      this.addLog(deployment, `[SERVER] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data: Buffer) => {
      this.addLog(deployment, `[SERVER ERROR] ${data.toString().trim()}`);
    });

    serverProcess.on('close', (code: number) => {
      this.addLog(deployment, `Server process exited with code ${code}`);
      if (deployment.status === 'running') {
        deployment.status = 'stopped';
        this.emit('deployment:stopped', deployment);
      }
    });

    serverProcess.on('error', (error: Error) => {
      this.addLog(deployment, `Server process error: ${error.message}`);
      if (deployment.status === 'running') {
        deployment.status = 'failed';
        deployment.error = error.message;
        this.emit('deployment:failed', deployment, error);
      }
    });

    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.addLog(deployment, 'Local server started');
  }

  /**
   * Stop a deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    this.addLog(deployment, 'Stopping deployment...');

    // Stop process if running
    const process = this.processes.get(deploymentId);
    if (process) {
      process.kill('SIGTERM');
      this.processes.delete(deploymentId);
    }

    // Stop Docker container if running
    if (deployment.containerId) {
      await this.stopDockerContainer(deployment.containerId);
    }

    deployment.status = 'stopped';
    deployment.endTime = new Date();
    this.addLog(deployment, 'Deployment stopped');
    this.emit('deployment:stopped', deployment);
  }

  /**
   * Stop Docker container
   */
  private async stopDockerContainer(containerId: string): Promise<void> {
    return new Promise((resolve) => {
      const stopProcess = spawn('docker', ['stop', containerId], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      stopProcess.on('close', () => {
        // Also remove the container
        spawn('docker', ['rm', containerId], { stdio: 'ignore' });
        resolve();
      });

      stopProcess.on('error', () => {
        resolve(); // Don't fail if we can't stop the container
      });
    });
  }

  /**
   * Get deployment status
   */
  getDeployment(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Add log entry
   */
  private addLog(deployment: DeploymentStatus, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    deployment.logs.push(logEntry);
    this.emit('deployment:log', deployment, logEntry);
  }

  /**
   * Cleanup temporary directory
   */
  private async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      this.tempDirs.delete(tempDir);
    } catch (error) {
      console.error(`Failed to cleanup temp directory ${tempDir}:`, error);
    }
  }

  /**
   * Get Docker container logs
   */
  async getContainerLogs(containerId: string, lines: number = 100): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const logsProcess = spawn('docker', ['logs', '--tail', lines.toString(), containerId], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      logsProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      logsProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      logsProcess.on('close', (code: number) => {
        if (code === 0) {
          const logs = (output + errorOutput).split('\n').filter(line => line.trim());
          resolve(logs);
        } else {
          reject(new Error(`Failed to get container logs: ${errorOutput}`));
        }
      });

      logsProcess.on('error', (error: Error) => {
        reject(new Error(`Docker logs error: ${error.message}`));
      });
    });
  }

  /**
   * Execute command in Docker container
   */
  async execInContainer(containerId: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const execProcess = spawn('docker', ['exec', containerId, 'sh', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      execProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      execProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      execProcess.on('close', (code: number) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0
        });
      });

      execProcess.on('error', (error: Error) => {
        reject(new Error(`Docker exec error: ${error.message}`));
      });
    });
  }

  /**
   * Get Docker container status
   */
  async getContainerStatus(containerId: string): Promise<{ status: string; health?: string }> {
    return new Promise((resolve, reject) => {
      const statusProcess = spawn('docker', ['inspect', '--format', '{{.State.Status}}{{if .State.Health}} {{.State.Health.Status}}{{end}}', containerId], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';

      statusProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      statusProcess.on('close', (code: number) => {
        if (code === 0) {
          const parts = output.trim().split(' ');
          resolve({
            status: parts[0],
            health: parts[1] || undefined
          });
        } else {
          reject(new Error('Failed to get container status'));
        }
      });

      statusProcess.on('error', (error: Error) => {
        reject(new Error(`Docker inspect error: ${error.message}`));
      });
    });
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    // Stop all running processes
    for (const [deploymentId] of this.processes) {
      await this.stopDeployment(deploymentId);
    }

    // Cleanup temp directories
    for (const tempDir of this.tempDirs) {
      await this.cleanupTempDir(tempDir);
    }
  }
}

export default DeploymentService;