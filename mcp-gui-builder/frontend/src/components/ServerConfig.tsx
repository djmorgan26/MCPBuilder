import React from 'react';
import type { ServerConfig as ServerConfigType, EnvironmentVariable } from '../types';
import { Settings, Plus, X } from 'lucide-react';

interface ServerConfigProps {
  config: ServerConfigType;
  onChange: (config: ServerConfigType) => void;
}

const ServerConfig: React.FC<ServerConfigProps> = ({ config, onChange }) => {
  const handleInputChange = (field: keyof ServerConfigType, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const handleEnvVarAdd = () => {
    const newKey = `ENV_VAR_${Object.keys(config.environment).length + 1}`;
    const newEnvVar: EnvironmentVariable = {
      key: newKey,
      value: '',
      description: '',
      required: false,
      secret: false,
    };
    handleInputChange('environment', {
      ...config.environment,
      [newKey]: newEnvVar,
    });
  };

  const handleEnvVarUpdate = (oldKey: string, updates: Partial<EnvironmentVariable>) => {
    const envVar = config.environment[oldKey];
    if (!envVar) return;

    const updatedEnvVar = { ...envVar, ...updates };
    const newEnvironment = { ...config.environment };

    if (updates.key && updates.key !== oldKey) {
      delete newEnvironment[oldKey];
      newEnvironment[updates.key] = updatedEnvVar;
    } else {
      newEnvironment[oldKey] = updatedEnvVar;
    }

    handleInputChange('environment', newEnvironment);
  };

  const handleEnvVarDelete = (key: string) => {
    const newEnvironment = { ...config.environment };
    delete newEnvironment[key];
    handleInputChange('environment', newEnvironment);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-mcp-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Server Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Server Name *
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
            placeholder="my-mcp-server"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={config.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
            placeholder="Describe what your MCP server does..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              value={config.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version
            </label>
            <input
              type="text"
              value={config.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
              placeholder="1.0.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Python Version
          </label>
          <select
            value={config.pythonVersion}
            onChange={(e) => handleInputChange('pythonVersion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
          >
            <option value="3.9">Python 3.9</option>
            <option value="3.10">Python 3.10</option>
            <option value="3.11">Python 3.11</option>
            <option value="3.12">Python 3.12</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Environment Variables
            </label>
            <button
              onClick={handleEnvVarAdd}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-mcp-primary hover:text-mcp-primary/80 hover:bg-mcp-light/50 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Variable</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(config.environment).map(([key, envVar]) => (
              <div key={key} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                <input
                  type="text"
                  value={envVar.key}
                  onChange={(e) => handleEnvVarUpdate(key, { key: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcp-primary"
                  placeholder="ENV_KEY"
                />
                <input
                  type="text"
                  value={envVar.value}
                  onChange={(e) => handleEnvVarUpdate(key, { value: e.target.value })}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcp-primary"
                  placeholder="default value"
                />
                <div className="flex items-center space-x-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={envVar.required}
                      onChange={(e) => handleEnvVarUpdate(key, { required: e.target.checked })}
                      className="w-3 h-3 text-mcp-primary border-gray-300 rounded focus:ring-mcp-primary"
                    />
                    <span className="ml-1 text-xs text-gray-600">Required</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={envVar.secret}
                      onChange={(e) => handleEnvVarUpdate(key, { secret: e.target.checked })}
                      className="w-3 h-3 text-mcp-primary border-gray-300 rounded focus:ring-mcp-primary"
                    />
                    <span className="ml-1 text-xs text-gray-600">Secret</span>
                  </label>
                </div>
                <button
                  onClick={() => handleEnvVarDelete(key)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Object.keys(config.environment).length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No environment variables configured
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConfig;