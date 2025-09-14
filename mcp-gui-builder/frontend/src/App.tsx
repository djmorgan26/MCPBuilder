import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ServerConfig from './components/ServerConfig';
import ToolTemplates from './components/ToolTemplates';
import ActiveTools from './components/ActiveTools';
import ResourceManager from './components/ResourceManager';
import CodePreview from './components/CodePreview';
import DeploymentPanel from './components/DeploymentPanel';
import ToolModal from './components/ToolModal';
import MCPConnections from './components/MCPConnections';
import MCPToolsExplorer from './components/MCPToolsExplorer';
import ProjectsPanel from './components/ProjectsPanel';
import type { ServerConfig as ServerConfigType, Tool, Resource, ToolTemplate, GeneratedCode, MCPServer, SavedProject } from './types';
import { generateCode } from './utils/codeGenerator';
import { validateServer } from './utils/validation';
import './App.css';

function App() {
  const [serverConfig, setServerConfig] = useState<ServerConfigType>({
    name: 'my-mcp-server',
    description: 'A custom MCP server built with GUI',
    author: '',
    version: '1.0.0',
    dependencies: [],
    environment: {},
    pythonVersion: '3.11'
  });

  const [tools, setTools] = useState<Tool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'resources' | 'code' | 'deploy' | 'connections' | 'explore' | 'projects'>('tools');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [selectedMCPServer, setSelectedMCPServer] = useState<MCPServer | null>(null);

  const handleAddTool = useCallback((template: ToolTemplate) => {
    const newTool: Tool = {
      id: `tool-${Date.now()}`,
      type: template.type,
      name: template.name,
      description: template.description,
      parameters: [],
      returnType: { type: 'string' },
      config: {},
      isValid: false,
      errors: [],
      order: tools.length,
      isAsync: false,
      requiresAuth: false
    };

    setSelectedTool(newTool);
    setIsToolModalOpen(true);
  }, [tools]);

  const handleSaveTool = useCallback((tool: Tool) => {
    const existingIndex = tools.findIndex(t => t.id === tool.id);

    if (existingIndex >= 0) {
      const updatedTools = [...tools];
      updatedTools[existingIndex] = tool;
      setTools(updatedTools);
    } else {
      setTools([...tools, tool]);
    }

    setIsToolModalOpen(false);
    setSelectedTool(null);
  }, [tools]);

  const handleEditTool = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setIsToolModalOpen(true);
  }, []);

  const handleDeleteTool = useCallback((toolId: string) => {
    setTools(tools.filter(t => t.id !== toolId));
  }, [tools]);

  const handleReorderTools = useCallback((dragIndex: number, dropIndex: number) => {
    const draggedTool = tools[dragIndex];
    const newTools = [...tools];
    newTools.splice(dragIndex, 1);
    newTools.splice(dropIndex, 0, draggedTool);

    // Update order property
    newTools.forEach((tool, index) => {
      tool.order = index;
    });

    setTools(newTools);
  }, [tools]);

  const handleGenerateCode = useCallback(() => {
    const validation = validateServer(serverConfig, tools, resources);

    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    const code = generateCode(serverConfig, tools, resources);
    setGeneratedCode(code);
    setActiveTab('code');
  }, [serverConfig, tools, resources]);

  const handleDeploy = useCallback(async () => {
    if (!generatedCode) {
      handleGenerateCode();
    }
    setActiveTab('deploy');
  }, [generatedCode, handleGenerateCode]);

  const handleLoadProject = useCallback((project: SavedProject) => {
    setServerConfig(project.serverConfig);
    setTools(project.tools);
    setResources(project.resources);
    setGeneratedCode(null); // Clear generated code when loading a project
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header
          onPreview={handleGenerateCode}
          onDeploy={handleDeploy}
          onHelp={() => window.open('/docs', '_blank')}
        />

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Configuration */}
            <div className="col-span-3 space-y-6">
              <ServerConfig
                config={serverConfig}
                onChange={setServerConfig}
              />

              {activeTab === 'tools' && (
                <ToolTemplates onAddTool={handleAddTool} />
              )}

              {activeTab === 'resources' && (
                <ResourceManager
                  resources={resources}
                  onChange={setResources}
                />
              )}
            </div>

            {/* Center Panel - Main Content */}
            <div className="col-span-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {(['tools', 'resources', 'connections', 'explore', 'projects', 'code', 'deploy'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                          py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === tab
                            ? 'border-mcp-primary text-mcp-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        {tab === 'connections' ? 'MCP Servers' :
                         tab === 'explore' ? 'Explore Tools' :
                         tab === 'projects' ? 'Projects' :
                         tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6 min-h-[600px]">
                  {activeTab === 'tools' && (
                    <ActiveTools
                      tools={tools}
                      onEdit={handleEditTool}
                      onDelete={handleDeleteTool}
                      onReorder={handleReorderTools}
                    />
                  )}

                  {activeTab === 'resources' && (
                    <div className="text-center py-12 text-gray-500">
                      Resource editor will appear here
                    </div>
                  )}

                  {activeTab === 'connections' && (
                    <MCPConnections
                      onServerSelect={setSelectedMCPServer}
                      selectedServerId={selectedMCPServer?.id}
                    />
                  )}

                  {activeTab === 'explore' && (
                    <MCPToolsExplorer
                      selectedServer={selectedMCPServer}
                    />
                  )}

                  {activeTab === 'projects' && (
                    <ProjectsPanel
                      serverConfig={serverConfig}
                      tools={tools}
                      resources={resources}
                      onLoadProject={handleLoadProject}
                    />
                  )}

                  {activeTab === 'code' && (
                    <CodePreview
                      serverConfig={serverConfig}
                      tools={tools}
                      resources={resources}
                      generatedCode={generatedCode}
                    />
                  )}

                  {activeTab === 'deploy' && (
                    <DeploymentPanel
                      serverConfig={serverConfig}
                      generatedCode={generatedCode}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Help & Info */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Help</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  {activeTab === 'tools' && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Building Tools</h4>
                        <p>1. Configure your server details</p>
                        <p>2. Add tools from templates</p>
                        <p>3. Configure each tool</p>
                        <p>4. Generate and deploy</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Drag tools to reorder them</li>
                          <li>Test tools before deployment</li>
                          <li>Use environment variables for secrets</li>
                          <li>Check generated code for customization</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {activeTab === 'connections' && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">MCP Connections</h4>
                        <p>1. Add MCP servers to connect to existing tools</p>
                        <p>2. Configure transport type (HTTP/WebSocket/Stdio)</p>
                        <p>3. Connect to discover available tools</p>
                        <p>4. Use tools directly or import to your build</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Transport Types</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li><strong>HTTP:</strong> REST API servers</li>
                          <li><strong>WebSocket:</strong> Real-time connections</li>
                          <li><strong>Stdio:</strong> Local subprocess servers</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {activeTab === 'explore' && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Tool Explorer</h4>
                        <p>1. Browse tools from connected MCP servers</p>
                        <p>2. Execute tools with custom parameters</p>
                        <p>3. View execution results and timing</p>
                        <p>4. Test server integration before deploying</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Execution Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Server must be connected to execute tools</li>
                          <li>Check parameter types and requirements</li>
                          <li>Use JSON format for complex parameters</li>
                          <li>Monitor execution time and errors</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {(activeTab === 'code' || activeTab === 'deploy' || activeTab === 'resources') && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Getting Started</h4>
                        <p>1. Configure your server details</p>
                        <p>2. Add tools from templates</p>
                        <p>3. Configure each tool</p>
                        <p>4. Generate and deploy</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Drag tools to reorder them</li>
                          <li>Test tools before deployment</li>
                          <li>Use environment variables for secrets</li>
                          <li>Check generated code for customization</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <ToolModal
          tool={selectedTool}
          isOpen={isToolModalOpen}
          onSave={handleSaveTool}
          onClose={() => {
            setIsToolModalOpen(false);
            setSelectedTool(null);
          }}
        />

        <Toaster position="bottom-right" />
      </div>
    </DndProvider>
  );
}

export default App;