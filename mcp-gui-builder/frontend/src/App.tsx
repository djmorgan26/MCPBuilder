import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';
import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import ProductGrid from './components/ProductGrid';
import Configurator from './components/Configurator';
import SummaryCheckout from './components/SummaryCheckout';
import ServerManagement from './components/ServerManagement';
import Footer from './components/Footer';
import ServerConfig from './components/ServerConfig';
import ResourceManager from './components/ResourceManager';
import CodePreview from './components/CodePreview';
import DeploymentPanel from './components/DeploymentPanel';
import ToolModal from './components/ToolModal';
import MCPConnections from './components/MCPConnections';
import MCPToolsExplorer from './components/MCPToolsExplorer';
import ProjectsPanel from './components/ProjectsPanel';
import type { ServerConfig as ServerConfigType, Tool, Resource, ToolTemplate, GeneratedCode, MCPServer, SavedProject } from './types';
import { ToolType } from './types';
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
  // const [currentSection, setCurrentSection] = useState<'hero' | 'products' | 'configurator' | 'checkout'>('hero');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [selectedMCPServer, setSelectedMCPServer] = useState<MCPServer | null>(null);
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [serverStatus, setServerStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');

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

  const handleSaveToolFromModal = useCallback((tool: Tool) => {
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

  const handleStartBuilding = useCallback(() => {
    // setCurrentSection('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToolToBuild = useCallback((template: ToolTemplate) => {
    handleAddTool(template);
    // setCurrentSection('configurator');
    // Scroll to configurator section
    setTimeout(() => {
      document.getElementById('configurator')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [handleAddTool]);

  const handleGenerateAndCheckout = useCallback(() => {
    handleGenerateCode();
    // setCurrentSection('checkout');
    setTimeout(() => {
      document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [handleGenerateCode]);

  const handleUpdateServerConfig = useCallback((config: ServerConfigType) => {
    setServerConfig(config);
  }, []);

  const handleSaveTool = useCallback((tool: Tool) => {
    const toolData = {
      ...tool,
      savedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    const dataStr = JSON.stringify(toolData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${tool.name.replace(/\s+/g, '-').toLowerCase()}-tool.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, []);

  const handleCreateToolFromScratch = useCallback(() => {
    const newTool: Tool = {
      id: `tool-${Date.now()}`,
      type: ToolType.CUSTOM,
      name: 'Custom Tool',
      description: 'A custom tool created from scratch',
      parameters: [
        {
          name: 'input',
          type: 'string',
          description: 'Input parameter',
          required: true
        }
      ],
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

  const handleLoadTool = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const toolData = JSON.parse(e.target?.result as string);
        // Create a new tool with a unique ID
        const loadedTool: Tool = {
          ...toolData,
          id: `tool-${Date.now()}`,
          order: tools.length,
          isValid: false, // Will be validated when opened
          errors: []
        };
        setSelectedTool(loadedTool);
        setIsToolModalOpen(true);
      } catch (error) {
        console.error('Error loading tool:', error);
        alert('Error loading tool file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [tools]);

  const handleClearAllTools = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all tools? This action cannot be undone.')) {
      setTools([]);
      setGeneratedCode(null);
    }
  }, []);

  const handleTestServer = useCallback(async () => {
    setServerStatus('starting');
    try {
      // Simulate server testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setServerStatus('running');
      setIsServerRunning(true);
    } catch (error) {
      setServerStatus('error');
      console.error('Server test failed:', error);
    }
  }, []);

  const handleDeployServer = useCallback(() => {
    handleGenerateCode();
    // Simulate deployment
    setServerStatus('starting');
    setTimeout(() => {
      setServerStatus('running');
      setIsServerRunning(true);
    }, 1000);
  }, [handleGenerateCode]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-dark-bg font-apple">
        {/* Navigation */}
        <NavBar
          onPreview={handleGenerateCode}
          onDeploy={handleGenerateAndCheckout}
          onHelp={() => window.open('/docs', '_blank')}
        />

        {/* Hero Section */}
        <HeroSection onStartBuilding={handleStartBuilding} />

        {/* Product Grid */}
        <ProductGrid onAddTool={handleAddToolToBuild} />

        {/* Configurator */}
        <Configurator
          tools={tools}
          onEdit={handleEditTool}
          onDelete={handleDeleteTool}
          onReorder={handleReorderTools}
          onSaveTool={handleSaveTool}
        />

        {/* Server Management */}
        <section className="py-20 bg-dark-bg">
          <div className="max-w-7xl mx-auto px-6">
            <ServerManagement
              serverConfig={serverConfig}
              tools={tools}
              resources={resources}
              onUpdateServerConfig={handleUpdateServerConfig}
              onSaveTool={handleSaveTool}
              onCreateToolFromScratch={handleCreateToolFromScratch}
              onLoadTool={handleLoadTool}
              onClearAllTools={handleClearAllTools}
              onTestServer={handleTestServer}
              onDeployServer={handleDeployServer}
              isServerRunning={isServerRunning}
              serverStatus={serverStatus}
            />
          </div>
        </section>

        {/* Summary/Checkout */}
        <SummaryCheckout
          serverConfig={serverConfig}
          tools={tools}
          resources={resources}
          generatedCode={generatedCode}
          onGenerate={handleGenerateCode}
          onDeploy={handleDeploy}
        />

        {/* Footer */}
        <Footer />

        {/* Legacy Components (Hidden but accessible via navigation) */}
        {activeTab !== 'tools' && (
          <div className="hidden">
            <ServerConfig
              config={serverConfig}
              onChange={setServerConfig}
            />
            <ResourceManager
              resources={resources}
              onChange={setResources}
            />
            <MCPConnections
              onServerSelect={setSelectedMCPServer}
              selectedServerId={selectedMCPServer?.id}
            />
            <MCPToolsExplorer
              selectedServer={selectedMCPServer || undefined}
            />
            <ProjectsPanel
              serverConfig={serverConfig}
              tools={tools}
              resources={resources}
              onLoadProject={handleLoadProject}
            />
            <CodePreview
              serverConfig={serverConfig}
              tools={tools}
              resources={resources}
              generatedCode={generatedCode}
            />
            <DeploymentPanel
              serverConfig={serverConfig}
              generatedCode={generatedCode}
            />
          </div>
        )}

        {/* Tool Modal */}
        <ToolModal
          tool={selectedTool}
          isOpen={isToolModalOpen}
          onSave={handleSaveToolFromModal}
          onClose={() => {
            setIsToolModalOpen(false);
            setSelectedTool(null);
          }}
        />

        {/* Toast Notifications */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111111',
              color: '#ffffff',
              border: '1px solid #1a1a1a',
            },
          }}
        />
      </div>
    </DndProvider>
  );
}

export default App;