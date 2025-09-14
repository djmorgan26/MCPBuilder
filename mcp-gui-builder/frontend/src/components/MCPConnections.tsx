import React, { useState, useEffect } from 'react';
import { Plus, Server, Wifi, WifiOff, AlertCircle, Settings, Play, Pause, Trash2 } from 'lucide-react';
import type { MCPServer, MCPServerConfig } from '../types';
import { MCPService } from '../utils/mcpService';

interface MCPConnectionsProps {
  onServerSelect?: (server: MCPServer) => void;
  selectedServerId?: string;
}

export const MCPConnections: React.FC<MCPConnectionsProps> = ({
  onServerSelect,
  selectedServerId
}) => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerConfig, setNewServerConfig] = useState({
    id: '',
    name: '',
    description: '',
    config: MCPService.createDefaultServerConfig()
  });

  useEffect(() => {
    loadServers();
    const interval = setInterval(loadServers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadServers = async () => {
    try {
      const serverList = await MCPService.getServers();
      setServers(serverList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectServer = async (serverId: string) => {
    try {
      await MCPService.connectServer(serverId);
      await loadServers(); // Refresh to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect server');
    }
  };

  const handleDisconnectServer = async (serverId: string) => {
    try {
      await MCPService.disconnectServer(serverId);
      await loadServers(); // Refresh to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect server');
    }
  };

  const handleAddServer = async () => {
    try {
      const validation = MCPService.validateServerConfig(newServerConfig.config);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      await MCPService.registerServer(newServerConfig);
      await loadServers();
      setShowAddServer(false);
      setNewServerConfig({
        id: '',
        name: '',
        description: '',
        config: MCPService.createDefaultServerConfig()
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    }
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-400" />;
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-gray-500';
      case 'connecting':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading servers...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">MCP Connections</h2>
          <p className="text-sm text-gray-600">Manage connections to Model Context Protocol servers</p>
        </div>
        <button
          onClick={() => setShowAddServer(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Server
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Server List */}
      <div className="space-y-3">
        {servers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No MCP servers configured</p>
            <p className="text-sm">Add a server to get started</p>
          </div>
        ) : (
          servers.map((server) => (
            <div
              key={server.id}
              className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                selectedServerId === server.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onServerSelect?.(server)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(server.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{server.name}</h3>
                    <p className="text-sm text-gray-600">{server.description || server.url}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`text-xs font-medium ${getStatusColor(server.status)}`}>
                        {server.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{server.protocol}</span>
                      {server.tools.length > 0 && (
                        <>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{server.tools.length} tools</span>
                        </>
                      )}
                    </div>
                    {server.error && (
                      <p className="text-xs text-red-600 mt-1">{server.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {server.status === 'connected' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnectServer(server.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Disconnect"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectServer(server.id);
                      }}
                      className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                      title="Connect"
                      disabled={server.status === 'connecting'}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Server Modal */}
      {showAddServer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add MCP Server</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Server ID
                </label>
                <input
                  type="text"
                  value={newServerConfig.id}
                  onChange={(e) => setNewServerConfig(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., my-mcp-server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newServerConfig.name}
                  onChange={(e) => setNewServerConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My MCP Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newServerConfig.description}
                  onChange={(e) => setNewServerConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description of what this server does..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Type
                </label>
                <select
                  value={newServerConfig.config.transport.type}
                  onChange={(e) => setNewServerConfig(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      transport: {
                        ...prev.config.transport,
                        type: e.target.value as 'stdio' | 'http' | 'websocket'
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="http">HTTP</option>
                  <option value="websocket">WebSocket</option>
                  <option value="stdio">Stdio</option>
                </select>
              </div>

              {(newServerConfig.config.transport.type === 'http' || newServerConfig.config.transport.type === 'websocket') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={newServerConfig.config.transport.endpoint || ''}
                    onChange={(e) => setNewServerConfig(prev => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        transport: {
                          ...prev.config.transport,
                          endpoint: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="http://localhost:8000 or ws://localhost:8080/mcp"
                  />
                </div>
              )}

              {newServerConfig.config.transport.type === 'stdio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Command
                  </label>
                  <input
                    type="text"
                    value={newServerConfig.config.command || ''}
                    onChange={(e) => setNewServerConfig(prev => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        command: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="python"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={newServerConfig.config.timeout}
                    onChange={(e) => setNewServerConfig(prev => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        timeout: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retries
                  </label>
                  <input
                    type="number"
                    value={newServerConfig.config.retries}
                    onChange={(e) => setNewServerConfig(prev => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        retries: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddServer(false);
                  setError(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddServer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!newServerConfig.id || !newServerConfig.name}
              >
                Add Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPConnections;