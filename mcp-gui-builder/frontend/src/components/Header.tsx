import React from 'react';
import { Code2, Rocket, HelpCircle, Github, Download } from 'lucide-react';

interface HeaderProps {
  onPreview: () => void;
  onDeploy: () => void;
  onHelp: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPreview, onDeploy, onHelp }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Code2 className="w-8 h-8 text-mcp-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">MCP GUI Builder</h1>
                <p className="text-xs text-gray-500">Visual MCP Server Creator</p>
              </div>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-mcp-light text-mcp-primary rounded-full">
              v1.0.0
            </span>
          </div>

          <nav className="flex items-center space-x-4">
            <button
              onClick={onPreview}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Code2 className="w-4 h-4" />
              <span>Preview Code</span>
            </button>

            <button
              onClick={onDeploy}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-mcp-primary hover:bg-mcp-primary/90 rounded-md transition-colors"
            >
              <Rocket className="w-4 h-4" />
              <span>Generate & Deploy</span>
            </button>

            <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
              <button
                onClick={() => window.open('https://github.com/djmorgan26/MCPBuilder', '_blank')}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </button>

              <button
                onClick={onHelp}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;