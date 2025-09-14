"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPGateway = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
class MCPGateway extends events_1.EventEmitter {
    constructor() {
        super();
        this.servers = new Map();
        this.connections = new Map();
        this.processes = new Map();
        this.wsClients = new Map();
        this.heartbeatInterval = null;
        this.startHeartbeat();
    }
    async registerServer(config) {
        const server = {
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
        if (config.transport.type !== 'stdio') {
            await this.connectServer(server.id);
        }
        return server;
    }
    async connectServer(serverId) {
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
            await this.discoverServerCapabilities(server);
            this.emit('server:connected', server);
        }
        catch (error) {
            server.status = 'error';
            server.error = error instanceof Error ? error.message : String(error);
            this.emit('server:error', server, error);
            throw error;
        }
    }
    async connectStdioServer(server) {
        if (!server.config.command) {
            throw new Error('Command is required for stdio transport');
        }
        const childProcess = (0, child_process_1.spawn)(server.config.command, server.config.args || [], {
            env: { ...process.env, ...server.config.env },
            stdio: ['pipe', 'pipe', 'pipe']
        });
        this.processes.set(server.id, childProcess);
        childProcess.on('error', (error) => {
            server.status = 'error';
            server.error = error.message;
            this.emit('server:error', server, error);
        });
        childProcess.on('exit', (code) => {
            server.status = 'disconnected';
            this.processes.delete(server.id);
            this.emit('server:disconnected', server);
        });
        childProcess.stdout?.on('data', (data) => {
            this.handleMCPMessage(server, data.toString());
        });
    }
    async connectHttpServer(server) {
        const endpoint = server.config.transport.endpoint;
        if (!endpoint) {
            throw new Error('Endpoint is required for HTTP transport');
        }
        try {
            const response = await axios_1.default.get(`${endpoint}/health`, {
                timeout: server.config.timeout || 5000,
                headers: this.getAuthHeaders(server.config.auth)
            });
            if (response.status !== 200) {
                throw new Error(`HTTP server returned status ${response.status}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to connect to HTTP server: ${error}`);
        }
    }
    async connectWebSocketServer(server) {
        const endpoint = server.config.transport.endpoint;
        if (!endpoint) {
            throw new Error('Endpoint is required for WebSocket transport');
        }
        return new Promise((resolve, reject) => {
            const ws = new ws_1.default(endpoint, {
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
    async disconnectServer(serverId) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`Server ${serverId} not found`);
        }
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
    async executeTool(serverId, toolName, parameters) {
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
        const execution = {
            id: (0, uuid_1.v4)(),
            toolName,
            serverId,
            parameters,
            startTime: new Date()
        };
        this.emit('tool:executing', execution);
        try {
            let result;
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
        }
        catch (error) {
            execution.error = error instanceof Error ? error.message : String(error);
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
            this.emit('tool:error', execution, error);
            throw error;
        }
    }
    getServers() {
        return Array.from(this.servers.values());
    }
    getAllTools() {
        const tools = [];
        for (const server of this.servers.values()) {
            tools.push(...server.tools);
        }
        return tools;
    }
    getAllResources() {
        const resources = [];
        for (const server of this.servers.values()) {
            resources.push(...server.resources);
        }
        return resources;
    }
    createConnection(serverId, clientInfo) {
        const connection = {
            id: (0, uuid_1.v4)(),
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
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.status = 'inactive';
            this.connections.delete(connectionId);
            this.emit('connection:closed', connection);
        }
    }
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
    getAuthHeaders(auth) {
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
    handleMCPMessage(server, message) {
        try {
            const data = JSON.parse(message);
            this.emit('message:received', server, data);
        }
        catch (error) {
            console.error(`Failed to parse MCP message from ${server.id}:`, error);
        }
    }
    async discoverServerCapabilities(server) {
        server.tools = [];
        server.resources = [];
    }
    async executeStdioTool(server, toolName, parameters) {
        const process = this.processes.get(server.id);
        if (!process) {
            throw new Error('Process not found');
        }
        const request = {
            jsonrpc: '2.0',
            id: (0, uuid_1.v4)(),
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
            const onData = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.id === request.id) {
                        clearTimeout(timeout);
                        process.stdout?.off('data', onData);
                        if (response.error) {
                            reject(new Error(response.error.message));
                        }
                        else {
                            resolve(response.result);
                        }
                    }
                }
                catch (error) {
                }
            };
            process.stdout?.on('data', onData);
            process.stdin?.write(JSON.stringify(request) + '\n');
        });
    }
    async executeHttpTool(server, toolName, parameters) {
        const endpoint = server.config.transport.endpoint;
        const response = await axios_1.default.post(`${endpoint}/tools/${toolName}/call`, {
            arguments: parameters
        }, {
            headers: this.getAuthHeaders(server.config.auth),
            timeout: server.config.timeout || 30000
        });
        return response.data;
    }
    async executeWebSocketTool(server, toolName, parameters) {
        const ws = this.wsClients.get(server.id);
        if (!ws) {
            throw new Error('WebSocket connection not found');
        }
        const request = {
            jsonrpc: '2.0',
            id: (0, uuid_1.v4)(),
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
            const onMessage = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    if (response.id === request.id) {
                        clearTimeout(timeout);
                        ws.off('message', onMessage);
                        if (response.error) {
                            reject(new Error(response.error.message));
                        }
                        else {
                            resolve(response.result);
                        }
                    }
                }
                catch (error) {
                }
            };
            ws.on('message', onMessage);
            ws.send(JSON.stringify(request));
        });
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            for (const server of this.servers.values()) {
                if (server.status === 'connected') {
                    this.checkServerHealth(server);
                }
            }
        }, 30000);
    }
    async checkServerHealth(server) {
        try {
            const now = new Date();
            const timeSinceLastHeartbeat = now.getTime() - server.lastHeartbeat.getTime();
            if (timeSinceLastHeartbeat > 60000) {
                server.status = 'error';
                server.error = 'Heartbeat timeout';
                this.emit('server:error', server, new Error('Heartbeat timeout'));
            }
        }
        catch (error) {
            server.status = 'error';
            server.error = error instanceof Error ? error.message : String(error);
            this.emit('server:error', server, error);
        }
    }
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        for (const process of this.processes.values()) {
            process.kill();
        }
        for (const ws of this.wsClients.values()) {
            ws.close();
        }
        this.servers.clear();
        this.connections.clear();
        this.processes.clear();
        this.wsClients.clear();
    }
}
exports.MCPGateway = MCPGateway;
exports.default = MCPGateway;
//# sourceMappingURL=mcpGateway.js.map