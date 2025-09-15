import { EventEmitter } from 'events';
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
export declare class DeploymentService extends EventEmitter {
    private deployments;
    private processes;
    private tempDirs;
    constructor();
    deploy(serverConfig: ServerConfig, generatedCode: GeneratedCode, deploymentConfig: DeploymentConfig): Promise<DeploymentStatus>;
    private deployToDocker;
    private deployLocal;
    private deployToCloud;
    private writeFilesToDirectory;
    private buildDockerImage;
    private runDockerContainer;
    private verifyDockerDeployment;
    private checkContainerRunning;
    private installDependencies;
    private startLocalServer;
    stopDeployment(deploymentId: string): Promise<void>;
    private stopDockerContainer;
    getDeployment(deploymentId: string): DeploymentStatus | undefined;
    getAllDeployments(): DeploymentStatus[];
    private addLog;
    private cleanupTempDir;
    getContainerLogs(containerId: string, lines?: number): Promise<string[]>;
    execInContainer(containerId: string, command: string): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }>;
    getContainerStatus(containerId: string): Promise<{
        status: string;
        health?: string;
    }>;
    cleanup(): Promise<void>;
}
export default DeploymentService;
//# sourceMappingURL=deploymentService.d.ts.map