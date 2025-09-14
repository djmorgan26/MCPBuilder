import type { MCPServer, MCPServerConfig, MCPTool, MCPResource, MCPToolExecution } from '../types';

const API_BASE = 'http://localhost:3001/api/mcp';

export class MCPService {
  /**
   * Get all registered MCP servers
   */
  static async getServers(): Promise<MCPServer[]> {
    const response = await fetch(`${API_BASE}/servers`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get servers');
    }

    return result.data;
  }

  /**
   * Register a new MCP server
   */
  static async registerServer(config: {
    id: string;
    name: string;
    description?: string;
    config: MCPServerConfig;
  }): Promise<MCPServer> {
    const response = await fetch(`${API_BASE}/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to register server');
    }

    return result.data;
  }

  /**
   * Connect to an MCP server
   */
  static async connectServer(serverId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/servers/${serverId}/connect`, {
      method: 'POST'
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to connect to server');
    }
  }

  /**
   * Disconnect from an MCP server
   */
  static async disconnectServer(serverId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/servers/${serverId}/disconnect`, {
      method: 'POST'
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to disconnect from server');
    }
  }

  /**
   * Execute a tool on an MCP server
   */
  static async executeTool(
    serverId: string,
    toolName: string,
    parameters: any = {}
  ): Promise<MCPToolExecution> {
    const response = await fetch(`${API_BASE}/servers/${serverId}/tools/${toolName}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parameters })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to execute tool');
    }

    return result.data;
  }

  /**
   * Get all available tools across all servers
   */
  static async getAllTools(): Promise<MCPTool[]> {
    const response = await fetch(`${API_BASE}/tools`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get tools');
    }

    return result.data;
  }

  /**
   * Get all available resources across all servers
   */
  static async getAllResources(): Promise<MCPResource[]> {
    const response = await fetch(`${API_BASE}/resources`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get resources');
    }

    return result.data;
  }

  /**
   * Get MCP Gateway health status
   */
  static async getHealth(): Promise<{
    status: 'healthy' | 'degraded';
    servers: {
      total: number;
      connected: number;
      error: number;
    };
    connections: number;
    uptime: number;
  }> {
    const response = await fetch(`${API_BASE}/health`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to get health status');
    }

    return result.data;
  }

  /**
   * Create a default server configuration
   */
  static createDefaultServerConfig(): MCPServerConfig {
    return {
      transport: {
        type: 'http',
        endpoint: '',
        port: 8000
      },
      auth: {
        type: 'none'
      },
      retries: 3,
      timeout: 30000
    };
  }

  /**
   * Validate server configuration
   */
  static validateServerConfig(config: MCPServerConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.transport) {
      errors.push('Transport configuration is required');
    } else {
      if (!config.transport.type) {
        errors.push('Transport type is required');
      }

      if (config.transport.type === 'http' || config.transport.type === 'websocket') {
        if (!config.transport.endpoint) {
          errors.push('Endpoint is required for HTTP/WebSocket transport');
        }
      }

      if (config.transport.type === 'stdio') {
        // No additional validation needed for stdio
      }
    }

    if (config.timeout && config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    }

    if (config.retries && config.retries < 0) {
      errors.push('Retries must be non-negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate example server configurations
   */
  static getExampleConfigs(): Array<{
    name: string;
    description: string;
    config: MCPServerConfig;
  }> {
    return [
      {
        name: 'Local FastMCP Server',
        description: 'A local FastMCP server running on port 8000',
        config: {
          transport: {
            type: 'http',
            endpoint: 'http://localhost:8000',
            port: 8000
          },
          auth: {
            type: 'none'
          },
          retries: 3,
          timeout: 30000
        }
      },
      {
        name: 'WebSocket MCP Server',
        description: 'An MCP server accessible via WebSocket',
        config: {
          transport: {
            type: 'websocket',
            endpoint: 'ws://localhost:8080/mcp'
          },
          auth: {
            type: 'bearer',
            credentials: {
              token: 'your-auth-token'
            }
          },
          retries: 5,
          timeout: 45000
        }
      },
      {
        name: 'Stdio MCP Server',
        description: 'An MCP server running as a subprocess',
        config: {
          command: 'python',
          args: ['main.py'],
          env: {
            'PYTHONPATH': '.'
          },
          transport: {
            type: 'stdio'
          },
          auth: {
            type: 'none'
          },
          retries: 2,
          timeout: 60000
        }
      }
    ];
  }
}

export default MCPService;