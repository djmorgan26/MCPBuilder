import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

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

export class MCPGateway extends EventEmitter {
  private servers: Map<string, MCPServer> = new Map();
  private connections: Map<string, MCPConnection> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private wsClients: Map<string, WebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHeartbeat();
  }

  /**
   * Register a new MCP server
   */
  async registerServer(config: MCPServerConfig & { id: string; name: string; description: string }): Promise<MCPServer> {
    const server: MCPServer = {
      id: config.id,
      name: config.name,
      description: config.description,
      url: config.transport.endpoint || `${config.transport.type}://${config.name}`,
      protocol: config.transport.type,
      status: 'disconnected',
      tools: [],
      resources: [],
      lastHeartbeat: new Date(),
      config,
    };

    this.servers.set(server.id, server);
    this.emit('server:registered', server);

    // Auto-connect if configured
    if (config.transport.type !== 'stdio') {
      await this.connectServer(server.id);
    }

    return server;
  }

  /**
   * Connect to an MCP server
   */
  async connectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    server.status = 'connecting';
    this.emit('server:connecting', server);

    try {
      switch (server.config.transport.type) {
        case 'stdio':
          await this.connectStdioServer(server);
          break;
        case 'http':
          await this.connectHttpServer(server);
          break;
        case 'websocket':
          await this.connectWebSocketServer(server);
          break;
      }

      server.status = 'connected';
      server.lastHeartbeat = new Date();
      server.error = undefined;

      // Discover tools and resources
      await this.discoverServerCapabilities(server);

      this.emit('server:connected', server);
    } catch (error) {
      server.status = 'error';
      server.error = error instanceof Error ? error.message : String(error);
      this.emit('server:error', server, error);
      throw error;
    }
  }

  /**
   * Connect to stdio-based MCP server
   */
  private async connectStdioServer(server: MCPServer): Promise<void> {
    if (!server.config.command) {
      throw new Error('Command is required for stdio transport');
    }

    const childProcess = spawn(server.config.command, server.config.args || [], {
      env: { ...process.env, ...server.config.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.processes.set(server.id, childProcess);

    childProcess.on('error', (error: Error) => {
      server.status = 'error';
      server.error = error.message;
      this.emit('server:error', server, error);
    });

    childProcess.on('exit', (code: number | null) => {
      server.status = 'disconnected';
      this.processes.delete(server.id);
      this.emit('server:disconnected', server);
    });

    // Handle stdout for MCP protocol messages
    childProcess.stdout?.on('data', (data: Buffer) => {
      this.handleMCPMessage(server, data.toString());
    });
  }

  /**
   * Connect to HTTP-based MCP server
   */
  private async connectHttpServer(server: MCPServer): Promise<void> {
    const endpoint = server.config.transport.endpoint;
    if (!endpoint) {
      throw new Error('Endpoint is required for HTTP transport');
    }

    try {
      // Test connection
      const response = await axios.get(`${endpoint}/health`, {
        timeout: server.config.timeout || 5000,
        headers: this.getAuthHeaders(server.config.auth)
      });

      if (response.status !== 200) {
        throw new Error(`HTTP server returned status ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to connect to HTTP server: ${error}`);
    }
  }

  /**
   * Connect to WebSocket-based MCP server
   */
  private async connectWebSocketServer(server: MCPServer): Promise<void> {
    const endpoint = server.config.transport.endpoint;
    if (!endpoint) {
      throw new Error('Endpoint is required for WebSocket transport');
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(endpoint, {
        headers: this.getAuthHeaders(server.config.auth)
      });

      ws.on('open', () => {
        this.wsClients.set(server.id, ws);
        resolve();
      });

      ws.on('error', (error) => {
        reject(error);
      });

      ws.on('message', (data) => {
        this.handleMCPMessage(server, data.toString());
      });

      ws.on('close', () => {
        server.status = 'disconnected';
        this.wsClients.delete(server.id);
        this.emit('server:disconnected', server);
      });
    });
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Close connections based on transport type
    const process = this.processes.get(serverId);
    if (process) {
      process.kill();
      this.processes.delete(serverId);
    }

    const ws = this.wsClients.get(serverId);
    if (ws) {
      ws.close();
      this.wsClients.delete(serverId);
    }

    server.status = 'disconnected';
    this.emit('server:disconnected', server);
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(serverId: string, toolName: string, parameters: any): Promise<MCPToolExecution> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`);
    }

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found on server ${serverId}`);
    }

    const execution: MCPToolExecution = {
      id: uuidv4(),
      toolName,
      serverId,
      parameters,
      startTime: new Date()
    };

    this.emit('tool:executing', execution);

    try {
      let result: any;

      switch (server.config.transport.type) {
        case 'stdio':
          result = await this.executeStdioTool(server, toolName, parameters);
          break;
        case 'http':
          result = await this.executeHttpTool(server, toolName, parameters);
          break;
        case 'websocket':
          result = await this.executeWebSocketTool(server, toolName, parameters);
          break;
      }

      execution.result = result;
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      this.emit('tool:executed', execution);
      return execution;
    } catch (error) {
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      this.emit('tool:error', execution, error);
      throw error;
    }
  }

  /**
   * Get all registered servers
   */
  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get all available tools across servers
   */
  getAllTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    for (const server of this.servers.values()) {
      tools.push(...server.tools);
    }
    return tools;
  }

  /**
   * Get all available resources across servers
   */
  getAllResources(): MCPResource[] {
    const resources: MCPResource[] = [];
    for (const server of this.servers.values()) {
      resources.push(...server.resources);
    }
    return resources;
  }

  /**
   * Create a connection for a client
   */
  createConnection(serverId: string, clientInfo?: any): MCPConnection {
    const connection: MCPConnection = {
      id: uuidv4(),
      serverId,
      status: 'active',
      connectedAt: new Date(),
      lastActivity: new Date(),
      clientInfo
    };

    this.connections.set(connection.id, connection);
    this.emit('connection:created', connection);

    return connection;
  }

  /**
   * Close a connection
   */
  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'inactive';
      this.connections.delete(connectionId);
      this.emit('connection:closed', connection);
    }
  }

  /**
   * Get gateway health status
   */
  getHealthStatus() {
    const servers = Array.from(this.servers.values());
    const connectedServers = servers.filter(s => s.status === 'connected');
    const errorServers = servers.filter(s => s.status === 'error');

    return {
      status: errorServers.length === 0 ? 'healthy' : 'degraded',
      servers: {
        total: servers.length,
        connected: connectedServers.length,
        error: errorServers.length
      },
      connections: this.connections.size,
      uptime: process.uptime()
    };
  }

  /**
   * Private helper methods
   */
  private getAuthHeaders(auth?: MCPServerConfig['auth']): Record<string, string> {
    if (!auth || auth.type === 'none') {
      return {};
    }

    switch (auth.type) {
      case 'bearer':
        return { Authorization: `Bearer ${auth.credentials?.token}` };
      case 'custom':
        return auth.credentials || {};
      default:
        return {};
    }
  }

  private handleMCPMessage(server: MCPServer, message: string): void {
    try {
      const data = JSON.parse(message);
      // Handle different MCP message types
      this.emit('message:received', server, data);
    } catch (error) {
      console.error(`Failed to parse MCP message from ${server.id}:`, error);
    }
  }

  private async discoverServerCapabilities(server: MCPServer): Promise<void> {
    // Implement capability discovery based on transport type
    // This would make MCP protocol calls to list tools and resources

    // Placeholder implementation
    server.tools = [];
    server.resources = [];
  }

  private async executeStdioTool(server: MCPServer, toolName: string, parameters: any): Promise<any> {
    const process = this.processes.get(server.id);
    if (!process) {
      throw new Error('Process not found');
    }

    // Send MCP tool execution request via stdin
    const request = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: parameters
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool execution timeout'));
      }, server.config.timeout || 30000);

      // Listen for response
      const onData = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === request.id) {
            clearTimeout(timeout);
            process.stdout?.off('data', onData);

            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          // Ignore parse errors, might be partial data
        }
      };

      process.stdout?.on('data', onData);
      process.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  private async executeHttpTool(server: MCPServer, toolName: string, parameters: any): Promise<any> {
    const endpoint = server.config.transport.endpoint;
    const response = await axios.post(`${endpoint}/tools/${toolName}/call`, {
      arguments: parameters
    }, {
      headers: this.getAuthHeaders(server.config.auth),
      timeout: server.config.timeout || 30000
    });

    return response.data;
  }

  private async executeWebSocketTool(server: MCPServer, toolName: string, parameters: any): Promise<any> {
    const ws = this.wsClients.get(server.id);
    if (!ws) {
      throw new Error('WebSocket connection not found');
    }

    const request = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: parameters
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Tool execution timeout'));
      }, server.config.timeout || 30000);

      const onMessage = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === request.id) {
            clearTimeout(timeout);
            ws.off('message', onMessage);

            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch (error) {
          // Ignore parse errors
        }
      };

      ws.on('message', onMessage);
      ws.send(JSON.stringify(request));
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const server of this.servers.values()) {
        if (server.status === 'connected') {
          this.checkServerHealth(server);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private async checkServerHealth(server: MCPServer): Promise<void> {
    try {
      // Implement health check based on transport type
      const now = new Date();
      const timeSinceLastHeartbeat = now.getTime() - server.lastHeartbeat.getTime();

      if (timeSinceLastHeartbeat > 60000) { // 1 minute timeout
        server.status = 'error';
        server.error = 'Heartbeat timeout';
        this.emit('server:error', server, new Error('Heartbeat timeout'));
      }
    } catch (error) {
      server.status = 'error';
      server.error = error instanceof Error ? error.message : String(error);
      this.emit('server:error', server, error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all processes
    for (const process of this.processes.values()) {
      process.kill();
    }

    // Close all WebSocket connections
    for (const ws of this.wsClients.values()) {
      ws.close();
    }

    this.servers.clear();
    this.connections.clear();
    this.processes.clear();
    this.wsClients.clear();
  }
}

export default MCPGateway;