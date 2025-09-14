import React, { useState, useEffect } from 'react';
import { Play, Search, Server, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { MCPServer, MCPTool, MCPToolExecution } from '../types';
import { MCPService } from '../utils/mcpService';

interface MCPToolsExplorerProps {
  selectedServer?: MCPServer;
}

export const MCPToolsExplorer: React.FC<MCPToolsExplorerProps> = ({ selectedServer }) => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolParameters, setToolParameters] = useState<Record<string, any>>({});
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<MCPToolExecution | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [toolsList, serversList] = await Promise.all([
        MCPService.getAllTools(),
        MCPService.getServers()
      ]);
      setTools(toolsList);
      setServers(serversList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedServer) {
      return matchesSearch && tool.serverId === selectedServer.id;
    }

    return matchesSearch;
  });

  const getServerById = (serverId: string) => {
    return servers.find(s => s.id === serverId);
  };

  const handleExecuteTool = async () => {
    if (!selectedTool) return;

    setExecuting(true);
    setExecutionResult(null);

    try {
      const result = await MCPService.executeTool(
        selectedTool.serverId,
        selectedTool.name,
        toolParameters
      );
      setExecutionResult(result);
    } catch (err) {
      setExecutionResult({
        id: 'error',
        toolName: selectedTool.name,
        serverId: selectedTool.serverId,
        parameters: toolParameters,
        error: err instanceof Error ? err.message : 'Execution failed',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0
      });
    } finally {
      setExecuting(false);
    }
  };

  const renderParameterInput = (param: any, value: any, onChange: (value: any) => void) => {
    switch (param.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={param.description}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={param.description}
          />
        );
      case 'boolean':
        return (
          <select
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onChange={(e) => onChange(e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      default:
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value || '', null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder={`${param.type} - ${param.description}`}
            rows={3}
          />
        );
    }
  };

  const getExecutionStatusIcon = (result: MCPToolExecution) => {
    if (result.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (result.result !== undefined) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading tools...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">MCP Tools Explorer</h2>
          <p className="text-sm text-gray-600">
            {selectedServer ? `Tools from ${selectedServer.name}` : 'Explore and execute tools from connected MCP servers'}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tools List */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Available Tools</h3>

          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tools available</p>
              <p className="text-sm">Connect to MCP servers to see their tools</p>
            </div>
          ) : (
            filteredTools.map((tool) => {
              const server = getServerById(tool.serverId);
              return (
                <div
                  key={`${tool.serverId}-${tool.name}`}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTool?.name === tool.name && selectedTool?.serverId === tool.serverId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedTool(tool)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{tool.name}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {server?.name || tool.serverId}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Server className="w-3 h-3 mr-1" />
                    <span>{server?.status || 'Unknown'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tool Execution Panel */}
        <div className="space-y-6">
          {selectedTool ? (
            <>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Execute Tool</h3>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedTool.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{selectedTool.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Server className="w-3 h-3 mr-1" />
                    <span>{getServerById(selectedTool.serverId)?.name || selectedTool.serverId}</span>
                  </div>
                </div>

                {/* Parameters */}
                {selectedTool.inputSchema?.properties && (
                  <div className="space-y-4 mb-4">
                    <h4 className="font-medium text-gray-900">Parameters</h4>
                    {Object.entries(selectedTool.inputSchema.properties).map(([paramName, paramSchema]: [string, any]) => (
                      <div key={paramName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {paramName}
                          {selectedTool.inputSchema.required?.includes(paramName) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          <span className="text-gray-500 ml-1">({paramSchema.type})</span>
                        </label>
                        {renderParameterInput(
                          { ...paramSchema, type: paramSchema.type },
                          toolParameters[paramName],
                          (value) => setToolParameters(prev => ({ ...prev, [paramName]: value }))
                        )}
                        {paramSchema.description && (
                          <p className="text-xs text-gray-500 mt-1">{paramSchema.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleExecuteTool}
                  disabled={executing || getServerById(selectedTool.serverId)?.status !== 'connected'}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {executing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {executing ? 'Executing...' : 'Execute Tool'}
                </button>

                {getServerById(selectedTool.serverId)?.status !== 'connected' && (
                  <p className="text-sm text-red-600 mt-2">
                    Server must be connected to execute tools
                  </p>
                )}
              </div>

              {/* Execution Result */}
              {executionResult && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {getExecutionStatusIcon(executionResult)}
                      <h4 className="font-medium text-gray-900 ml-2">Execution Result</h4>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{executionResult.duration}ms</span>
                    </div>
                  </div>

                  {executionResult.error ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {executionResult.error}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {typeof executionResult.result === 'string'
                          ? executionResult.result
                          : JSON.stringify(executionResult.result, null, 2)
                        }
                      </pre>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div>Tool: {executionResult.toolName}</div>
                    <div>Server: {executionResult.serverId}</div>
                    <div>Started: {executionResult.startTime.toLocaleString()}</div>
                    {executionResult.endTime && (
                      <div>Completed: {executionResult.endTime.toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a tool to execute</p>
              <p className="text-sm">Choose from the available tools on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCPToolsExplorer;