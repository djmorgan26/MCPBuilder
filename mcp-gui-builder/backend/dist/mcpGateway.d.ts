import { EventEmitter } from 'events';
export interface MCPServer {
    id: string;
    name: string;
    description: string;
    url: string;
    protocol: 'stdio' | 'http' | 'websocket';
    status: 'connected' | 'disconnected' | 'error' | 'connecting';
    tools: MCPTool[];
    resources: MCPResource[];
    lastHeartbeat: Date;
    config: MCPServerConfig;
    error?: string;
}
export interface MCPServerConfig {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    transport: {
        type: 'stdio' | 'http' | 'websocket';
        endpoint?: string;
        port?: number;
    };
    auth?: {
        type: 'none' | 'bearer' | 'oauth' | 'custom';
        credentials?: Record<string, string>;
    };
    retries: number;
    timeout: number;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    serverId: string;
}
export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    serverId: string;
}
export interface MCPConnection {
    id: string;
    serverId: string;
    status: 'active' | 'inactive' | 'error';
    connectedAt: Date;
    lastActivity: Date;
    clientInfo?: {
        userAgent: string;
        ip: string;
    };
}
export interface MCPToolExecution {
    id: string;
    toolName: string;
    serverId: string;
    parameters: any;
    result?: any;
    error?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
}
export declare class MCPGateway extends EventEmitter {
    private servers;
    private connections;
    private processes;
    private wsClients;
    private heartbeatInterval;
    constructor();
    registerServer(config: MCPServerConfig & {
        id: string;
        name: string;
        description: string;
    }): Promise<MCPServer>;
    connectServer(serverId: string): Promise<void>;
    private connectStdioServer;
    private connectHttpServer;
    private connectWebSocketServer;
    disconnectServer(serverId: string): Promise<void>;
    executeTool(serverId: string, toolName: string, parameters: any): Promise<MCPToolExecution>;
    getServers(): MCPServer[];
    getAllTools(): MCPTool[];
    getAllResources(): MCPResource[];
    createConnection(serverId: string, clientInfo?: any): MCPConnection;
    closeConnection(connectionId: string): void;
    getHealthStatus(): {
        status: string;
        servers: {
            total: number;
            connected: number;
            error: number;
        };
        connections: number;
        uptime: number;
    };
    private getAuthHeaders;
    private handleMCPMessage;
    private discoverServerCapabilities;
    private executeStdioTool;
    private executeHttpTool;
    private executeWebSocketTool;
    private startHeartbeat;
    private checkServerHealth;
    destroy(): void;
}
export default MCPGateway;
//# sourceMappingURL=mcpGateway.d.ts.map