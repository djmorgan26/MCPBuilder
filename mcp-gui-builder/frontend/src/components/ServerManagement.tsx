import React, { useState } from 'react';
import {
  Settings, Save, Upload, Download, Trash2, Play, Pause, 
  RefreshCw, Monitor, Database, Key, Globe, Terminal,
  AlertCircle, CheckCircle, Clock, Server, Activity, Plus
} from 'lucide-react';
import type { ServerConfig, Tool, Resource } from '../types';

interface ServerManagementProps {
  serverConfig: ServerConfig;
  tools: Tool[];
  resources: Resource[];
  onUpdateServerConfig: (config: ServerConfig) => void;
  onSaveTool: (tool: Tool) => void;
  onCreateToolFromScratch: () => void;
  onLoadTool: (file: File) => void;
  onClearAllTools: () => void;
  onTestServer: () => void;
  onDeployServer: () => void;
  isServerRunning?: boolean;
  serverStatus?: 'stopped' | 'starting' | 'running' | 'error';
}

const ServerManagement: React.FC<ServerManagementProps> = ({
  serverConfig,
  tools,
  resources,
  onUpdateServerConfig,
  onSaveTool,
  onCreateToolFromScratch,
  onLoadTool,
  onClearAllTools,
  onTestServer,
  onDeployServer,
  isServerRunning = false,
  serverStatus = 'stopped'
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'env' | 'deploy' | 'logs'>('config');
  const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '', description: '', required: false, secret: false });

  const handleConfigChange = (field: keyof ServerConfig, value: any) => {
    onUpdateServerConfig({
      ...serverConfig,
      [field]: value
    });
  };

  const handleAddEnvVar = () => {
    if (newEnvVar.key && newEnvVar.value) {
      const updatedConfig = {
        ...serverConfig,
        environment: {
          ...serverConfig.environment,
          [newEnvVar.key]: {
            key: newEnvVar.key,
            value: newEnvVar.value,
            description: newEnvVar.description,
            required: newEnvVar.required,
            secret: newEnvVar.secret
          }
        }
      };
      onUpdateServerConfig(updatedConfig);
      setNewEnvVar({ key: '', value: '', description: '', required: false, secret: false });
    }
  };

  const handleRemoveEnvVar = (key: string) => {
    const updatedEnv = { ...serverConfig.environment };
    delete updatedEnv[key];
    onUpdateServerConfig({
      ...serverConfig,
      environment: updatedEnv
    });
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLoadTool(file);
    }
  };

  const getStatusColor = () => {
    switch (serverStatus) {
      case 'running': return 'text-status-success';
      case 'starting': return 'text-status-warning';
      case 'error': return 'text-status-error';
      default: return 'text-text-tertiary';
    }
  };

  const getStatusIcon = () => {
    switch (serverStatus) {
      case 'running': return <CheckCircle className="w-4 h-4" />;
      case 'starting': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-silver to-accent-neon rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-dark-bg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary font-apple">Server Management</h2>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {serverStatus.charAt(0).toUpperCase() + serverStatus.slice(1)}
                </span>
                {isServerRunning && (
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-status-success animate-pulse" />
                    <span className="text-xs text-status-success">Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onTestServer}
              disabled={tools.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-neon hover:from-accent-neon hover:to-accent-purple text-dark-bg font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Play className="w-4 h-4" />
              <span>Test Server</span>
            </button>

            <button
              onClick={onDeployServer}
              disabled={tools.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Globe className="w-4 h-4" />
              <span>Deploy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-border">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'env', label: 'Environment', icon: Key },
            { id: 'deploy', label: 'Deployment', icon: Globe },
            { id: 'logs', label: 'Logs', icon: Terminal }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-neon text-accent-neon'
                  : 'border-transparent text-text-tertiary hover:text-text-primary hover:border-dark-border'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Server Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Server Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={serverConfig.name}
                    onChange={(e) => handleConfigChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                    placeholder="my-mcp-server"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={serverConfig.version}
                    onChange={(e) => handleConfigChange('version', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                    placeholder="1.0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={serverConfig.author}
                    onChange={(e) => handleConfigChange('author', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Python Version
                  </label>
                  <select
                    value={serverConfig.pythonVersion}
                    onChange={(e) => handleConfigChange('pythonVersion', e.target.value)}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                  >
                    <option value="3.9">Python 3.9</option>
                    <option value="3.10">Python 3.10</option>
                    <option value="3.11">Python 3.11</option>
                    <option value="3.12">Python 3.12</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={serverConfig.description}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe your MCP server's purpose and functionality..."
                />
              </div>
            </div>

            {/* Tool Management */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Tool Management</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
                  <h4 className="text-md font-medium text-text-primary mb-3">Create Tools</h4>
                  <button
                    onClick={onCreateToolFromScratch}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Tool from Scratch</span>
                  </button>
                </div>

                <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
                  <h4 className="text-md font-medium text-text-primary mb-3">Import Tools</h4>
                  <label className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-dark-card border border-dark-border text-text-primary hover:border-accent-silver hover:text-accent-silver rounded-lg transition-all duration-200 cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span>Load Saved Tool</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileLoad}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (tools.length > 0) {
                      // Save the first valid tool as an example
                      const validTool = tools.find(t => t.isValid);
                      if (validTool) {
                        onSaveTool(validTool);
                      }
                    }
                  }}
                  disabled={tools.length === 0 || !tools.some(t => t.isValid)}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-surface border border-dark-border text-text-primary hover:border-accent-silver hover:text-accent-silver rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Current Tool</span>
                </button>

                <button
                  onClick={onClearAllTools}
                  disabled={tools.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-status-error/10 border border-status-error/20 text-status-error hover:bg-status-error/20 hover:border-status-error/40 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Tools</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'env' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Environment Variables</h3>
              <div className="text-sm text-text-secondary">
                {Object.keys(serverConfig.environment).length} variables configured
              </div>
            </div>

            {/* Add New Environment Variable */}
            <div className="bg-dark-surface rounded-lg p-4">
              <h4 className="text-md font-medium text-text-primary mb-4">Add Environment Variable</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Key
                  </label>
                  <input
                    type="text"
                    value={newEnvVar.key}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                    placeholder="DATABASE_URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Value
                  </label>
                  <input
                    type={newEnvVar.secret ? 'password' : 'text'}
                    value={newEnvVar.value}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                    placeholder="postgresql://user:pass@localhost/db"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newEnvVar.description}
                  onChange={(e) => setNewEnvVar({ ...newEnvVar, description: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                  placeholder="Database connection string"
                />
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newEnvVar.required}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, required: e.target.checked })}
                    className="w-4 h-4 text-accent-neon bg-dark-card border-dark-border rounded focus:ring-accent-neon"
                  />
                  <span className="text-sm text-text-secondary">Required</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newEnvVar.secret}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, secret: e.target.checked })}
                    className="w-4 h-4 text-accent-neon bg-dark-card border-dark-border rounded focus:ring-accent-neon"
                  />
                  <span className="text-sm text-text-secondary">Secret</span>
                </label>
                <button
                  onClick={handleAddEnvVar}
                  className="px-4 py-2 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Add Variable
                </button>
              </div>
            </div>

            {/* Environment Variables List */}
            <div className="space-y-3">
              {Object.entries(serverConfig.environment).map(([key, envVar]) => (
                <div key={key} className="bg-dark-surface rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Key className="w-4 h-4 text-accent-neon" />
                      <div>
                        <div className="font-medium text-text-primary">{envVar.key}</div>
                        <div className="text-sm text-text-secondary">{envVar.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {envVar.required && (
                          <span className="px-2 py-1 bg-status-warning/20 text-status-warning text-xs rounded-full">
                            Required
                          </span>
                        )}
                        {envVar.secret && (
                          <span className="px-2 py-1 bg-status-error/20 text-status-error text-xs rounded-full">
                            Secret
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveEnvVar(key)}
                        className="p-2 text-text-tertiary hover:text-status-error rounded-lg hover:bg-status-error/10 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-text-primary">Deployment Options</h3>
            
            {/* Deployment Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-dark-surface rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-8 h-8 text-accent-neon" />
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{tools.length}</div>
                    <div className="text-sm text-text-secondary">Tools</div>
                  </div>
                </div>
              </div>
              <div className="bg-dark-surface rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Key className="w-8 h-8 text-accent-purple" />
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      {Object.keys(serverConfig.environment).length}
                    </div>
                    <div className="text-sm text-text-secondary">Env Variables</div>
                  </div>
                </div>
              </div>
              <div className="bg-dark-surface rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-8 h-8 text-accent-silver" />
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{resources.length}</div>
                    <div className="text-sm text-text-secondary">Resources</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Actions */}
            <div className="bg-dark-surface rounded-lg p-6">
              <h4 className="text-md font-medium text-text-primary mb-4">Deployment Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onTestServer}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-neon hover:from-accent-neon hover:to-accent-purple text-dark-bg font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-4 h-4" />
                  <span>Test Server</span>
                </button>
                <button
                  onClick={onDeployServer}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Globe className="w-4 h-4" />
                  <span>Deploy to Production</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-dark-card border border-dark-border text-text-primary hover:border-accent-silver hover:text-accent-silver rounded-lg transition-all duration-200">
                  <Download className="w-4 h-4" />
                  <span>Download Package</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Server Logs</h3>
              <button className="flex items-center space-x-2 px-3 py-1 bg-dark-surface border border-dark-border text-text-secondary hover:text-text-primary rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="bg-dark-surface rounded-lg p-4">
              <div className="font-mono text-sm text-text-secondary space-y-1">
                <div className="text-status-success">[INFO] Server initialized successfully</div>
                <div className="text-text-primary">[DEBUG] Loading {tools.length} tools</div>
                <div className="text-status-warning">[WARN] No environment variables configured</div>
                <div className="text-text-primary">[DEBUG] Server ready on port 3000</div>
                {isServerRunning && (
                  <div className="text-status-success">[INFO] Server is running and healthy</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerManagement;
