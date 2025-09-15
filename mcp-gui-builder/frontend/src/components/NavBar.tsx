import React from 'react';
import { Code2, Sparkles, Github, HelpCircle, ShoppingBag } from 'lucide-react';

interface NavBarProps {
  onPreview: () => void;
  onDeploy: () => void;
  onHelp: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ onPreview, onDeploy, onHelp }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-silver to-accent-neon rounded-lg flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-dark-bg" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-accent-silver to-accent-neon rounded-lg blur-sm opacity-30"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary font-apple">
                  MCP Builder
                </h1>
                <p className="text-xs text-text-tertiary">
                  Professional Server Studio
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <span className="px-3 py-1 text-xs font-medium bg-dark-card text-accent-silver rounded-full border border-dark-border">
                v1.0.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#products" className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium">
              Products
            </a>
            <a href="#configurator" className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium">
              Configurator
            </a>
            <a href="#gallery" className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium">
              Gallery
            </a>
            <a href="#support" className="text-text-secondary hover:text-text-primary transition-colors duration-200 font-medium">
              Support
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onPreview}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 text-sm font-medium text-text-primary hover:text-accent-neon transition-colors duration-200 rounded-lg hover:bg-dark-surface"
            >
              <Sparkles className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <button
              onClick={onDeploy}
              className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-dark-bg bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver transition-all duration-300 rounded-lg shadow-glow hover:shadow-neon transform hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Deploy</span>
            </button>

            {/* Secondary Actions */}
            <div className="flex items-center space-x-2 border-l border-dark-border pl-4">
              <button
                onClick={() => window.open('https://github.com/djmorgan26/MCPBuilder', '_blank')}
                className="p-2 text-text-tertiary hover:text-accent-silver rounded-lg hover:bg-dark-surface transition-all duration-200"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </button>

              <button
                onClick={onHelp}
                className="p-2 text-text-tertiary hover:text-accent-silver rounded-lg hover:bg-dark-surface transition-all duration-200"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
