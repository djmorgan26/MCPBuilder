import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Download, Copy, RefreshCw, FileText, Package, Settings, TestTube } from 'lucide-react';
import type { ServerConfig, Tool, Resource, GeneratedCode } from '../types';
import { generateCode } from '../utils/codeGenerator';

interface CodePreviewProps {
  serverConfig: ServerConfig;
  tools: Tool[];
  resources: Resource[];
  generatedCode: GeneratedCode | null;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  serverConfig,
  tools,
  resources,
  generatedCode
}) => {
  const [selectedFile, setSelectedFile] = useState<keyof GeneratedCode>('mainPy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [localGeneratedCode, setLocalGeneratedCode] = useState<GeneratedCode | null>(generatedCode);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  useEffect(() => {
    setLocalGeneratedCode(generatedCode);
  }, [generatedCode]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const code = generateCode(serverConfig, tools, resources);
      setLocalGeneratedCode(code);
    } catch (error) {
      console.error('Code generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!localGeneratedCode) return;

    const files = [
      { content: localGeneratedCode.mainPy, name: 'main.py' },
      { content: localGeneratedCode.requirements, name: 'requirements.txt' },
      { content: localGeneratedCode.dockerfile, name: 'Dockerfile' },
      { content: localGeneratedCode.dockerCompose, name: 'docker-compose.yml' },
      { content: localGeneratedCode.readme, name: 'README.md' },
      { content: localGeneratedCode.envExample, name: '.env.example' },
      { content: localGeneratedCode.tests, name: 'test_server.py' },
    ];

    files.forEach(file => {
      setTimeout(() => handleDownload(file.content, file.name), 100);
    });
  };

  const fileOptions = [
    { key: 'mainPy' as const, label: 'main.py', icon: FileText, language: 'python' },
    { key: 'requirements' as const, label: 'requirements.txt', icon: Package, language: 'text' },
    { key: 'dockerfile' as const, label: 'Dockerfile', icon: Settings, language: 'dockerfile' },
    { key: 'dockerCompose' as const, label: 'docker-compose.yml', icon: Settings, language: 'yaml' },
    { key: 'readme' as const, label: 'README.md', icon: FileText, language: 'markdown' },
    { key: 'envExample' as const, label: '.env.example', icon: Settings, language: 'text' },
    { key: 'tests' as const, label: 'test_server.py', icon: TestTube, language: 'python' },
  ];

  const selectedFileContent = localGeneratedCode ? localGeneratedCode[selectedFile] : '';
  const selectedFileOption = fileOptions.find(f => f.key === selectedFile);

  if (!localGeneratedCode) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Code Generated Yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Generate code from your server configuration and tools to preview it here.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || tools.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors mx-auto ${
              isGenerating || tools.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-mcp-primary text-white hover:bg-mcp-primary/90'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
          </button>
          {tools.length === 0 && (
            <p className="text-xs text-red-500 mt-2">
              Add at least one tool before generating code
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Generated Code</h3>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              isGenerating
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'text-mcp-primary hover:text-mcp-primary/80 hover:bg-mcp-light/50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => selectedFileContent && handleCopy(selectedFileContent, selectedFileOption?.label || 'file')}
            className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedFile === selectedFileOption?.label ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={() => selectedFileContent && handleDownload(selectedFileContent, selectedFileOption?.label || 'file')}
            className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-white bg-mcp-primary hover:bg-mcp-primary/90 rounded-md transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Download All</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File Tabs */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-2 space-y-1">
            {fileOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.key}
                  onClick={() => setSelectedFile(option.key)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                    selectedFile === option.key
                      ? 'bg-mcp-primary text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1">
          <Editor
            value={selectedFileContent}
            language={selectedFileOption?.language || 'python'}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 14,
              lineNumbers: 'on',
              folding: true,
              lineHeight: 22,
              renderLineHighlight: 'none',
              selectOnLineNumbers: true,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between p-2 text-xs text-gray-500 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <span>{tools.length} tools configured</span>
          <span>{resources.length} resources defined</span>
          <span>{Object.keys(serverConfig.environment).length} environment variables</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Python {serverConfig.pythonVersion}</span>
          <span>{selectedFileContent.split('\n').length} lines</span>
          <span>{Math.round(selectedFileContent.length / 1024 * 10) / 10} KB</span>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;