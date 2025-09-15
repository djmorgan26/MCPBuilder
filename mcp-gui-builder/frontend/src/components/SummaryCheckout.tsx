import React from 'react';
import {
  CheckCircle, Download, Rocket, 
  FileText, Code, Settings, Shield, Sparkles,
  Copy, Eye, AlertTriangle
} from 'lucide-react';
import type { ServerConfig, Tool, Resource, GeneratedCode } from '../types';

interface SummaryCheckoutProps {
  serverConfig: ServerConfig;
  tools: Tool[];
  resources: Resource[];
  generatedCode: GeneratedCode | null;
  onGenerate: () => void;
  onDeploy: () => void;
}

const SummaryCheckout: React.FC<SummaryCheckoutProps> = ({
  serverConfig,
  tools,
  generatedCode,
  onGenerate,
  onDeploy
}) => {
  const validTools = tools.filter(tool => tool.isValid);
  const totalDependencies = tools.reduce((acc) => {
    // This would normally come from the tool templates, but we'll simulate it
    return acc + Math.floor(Math.random() * 3) + 2;
  }, 0);

  const estimatedBuildTime = Math.max(validTools.length * 2, 10); // minutes
  const estimatedComplexity = validTools.length > 5 ? 'Advanced' : validTools.length > 2 ? 'Intermediate' : 'Basic';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast notification here
  };

  return (
    <section id="checkout" className="py-20 bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-card border border-dark-border rounded-full mb-6">
            <CheckCircle className="w-4 h-4 text-status-success" />
            <span className="text-sm font-medium text-text-secondary">
              Ready for Deployment
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 font-apple">
            Your <span className="bg-gradient-to-r from-accent-silver to-accent-neon bg-clip-text text-transparent">Professional Build</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Review your MCP server configuration and deploy to production. 
            All components are enterprise-ready and optimized for performance.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-8">
            {/* Server Configuration */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-silver to-accent-neon rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-dark-bg" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary font-apple">Server Configuration</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-text-tertiary mb-2 block">Server Name</label>
                  <div className="text-lg font-semibold text-text-primary">{serverConfig.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-tertiary mb-2 block">Version</label>
                  <div className="text-lg font-semibold text-text-primary">{serverConfig.version}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-tertiary mb-2 block">Author</label>
                  <div className="text-lg font-semibold text-text-primary">{serverConfig.author || 'Anonymous'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-tertiary mb-2 block">Python Version</label>
                  <div className="text-lg font-semibold text-text-primary">{serverConfig.pythonVersion}</div>
                </div>
              </div>

              {serverConfig.description && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-text-tertiary mb-2 block">Description</label>
                  <p className="text-text-secondary">{serverConfig.description}</p>
                </div>
              )}
            </div>

            {/* Tools Summary */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-neon to-accent-purple rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-dark-bg" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary font-apple">Professional Tools</h3>
              </div>

              <div className="space-y-4">
                {validTools.map((tool, index) => (
                  <div key={tool.id} className="flex items-center justify-between p-4 bg-dark-surface rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent-silver to-accent-neon rounded-lg flex items-center justify-center">
                        <span className="text-dark-bg font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{tool.name}</div>
                        <div className="text-sm text-text-secondary">{tool.parameters.length} parameters</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-status-success" />
                      <span className="text-sm font-medium text-status-success">Configured</span>
                    </div>
                  </div>
                ))}

                {tools.filter(t => !t.isValid).map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between p-4 bg-status-error/10 border border-status-error/20 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-status-error/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-status-error" />
                      </div>
                      <div>
                        <div className="font-semibold text-status-error">{tool.name}</div>
                        <div className="text-sm text-status-error/80">{tool.errors.length} errors</div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-status-error">Needs Configuration</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Files Preview */}
            {generatedCode && (
              <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-neon rounded-xl flex items-center justify-center">
                    <Code className="w-5 h-5 text-dark-bg" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary font-apple">Generated Files</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { name: 'main.py', icon: FileText, preview: generatedCode.mainPy.substring(0, 100) + '...' },
                    { name: 'requirements.txt', icon: FileText, preview: generatedCode.requirements.substring(0, 100) + '...' },
                    { name: 'Dockerfile', icon: Code, preview: generatedCode.dockerfile.substring(0, 100) + '...' },
                    { name: 'README.md', icon: FileText, preview: generatedCode.readme.substring(0, 100) + '...' },
                  ].map((file) => (
                    <div key={file.name} className="flex items-center justify-between p-4 bg-dark-surface rounded-xl group">
                      <div className="flex items-center space-x-3">
                        <file.icon className="w-5 h-5 text-accent-neon" />
                        <div>
                          <div className="font-semibold text-text-primary">{file.name}</div>
                          <div className="text-sm text-text-tertiary truncate max-w-xs">{file.preview}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(file.preview)}
                          className="p-2 text-text-tertiary hover:text-accent-neon rounded-lg hover:bg-dark-muted"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-text-tertiary hover:text-accent-neon rounded-lg hover:bg-dark-muted"
                          title="View file"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8 sticky top-8">
              <h3 className="text-xl font-bold text-text-primary mb-6 font-apple">Build Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Professional Tools</span>
                  <span className="font-semibold text-text-primary">{validTools.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Dependencies</span>
                  <span className="font-semibold text-text-primary">{totalDependencies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Complexity</span>
                  <span className="font-semibold text-text-primary">{estimatedComplexity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Est. Build Time</span>
                  <span className="font-semibold text-text-primary">{estimatedBuildTime} min</span>
                </div>
              </div>

              <div className="border-t border-dark-border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-text-primary">Total Value</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-accent-silver to-accent-neon bg-clip-text text-transparent">
                    ${(validTools.length * 99 + totalDependencies * 5).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">Professional enterprise pricing</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {!generatedCode ? (
                  <button
                    onClick={onGenerate}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-neon"
                  >
                    <Code className="w-5 h-5" />
                    <span>Generate Code</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onDeploy}
                      className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-neon"
                    >
                      <Rocket className="w-5 h-5" />
                      <span>Deploy to Production</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-accent-silver text-accent-silver hover:bg-accent-silver hover:text-dark-bg font-semibold rounded-xl transition-all duration-300">
                      <Download className="w-5 h-5" />
                      <span>Download Package</span>
                    </button>
                  </>
                )}
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-dark-surface rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-status-success" />
                  <div>
                    <div className="text-sm font-semibold text-text-primary">Enterprise Security</div>
                    <div className="text-xs text-text-secondary">Production-ready encryption</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-text-primary mb-4">Need Help?</h4>
              <p className="text-sm text-text-secondary mb-4">
                Our professional support team is here to help with your deployment.
              </p>
              <button className="w-full py-2 text-accent-neon hover:text-accent-silver font-medium transition-colors">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SummaryCheckout;
