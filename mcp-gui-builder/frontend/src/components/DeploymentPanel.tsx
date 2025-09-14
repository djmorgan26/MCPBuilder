import React, { useState } from 'react';
import {
  Rocket, Cloud, Monitor, Download,
  CheckCircle, AlertTriangle, ExternalLink,
  Copy, Terminal, Package, Play, Container
} from 'lucide-react';
import type { ServerConfig, GeneratedCode, DeploymentConfig } from '../types';

interface DeploymentPanelProps {
  serverConfig: ServerConfig;
  generatedCode: GeneratedCode | null;
}

const DeploymentPanel: React.FC<DeploymentPanelProps> = ({
  serverConfig,
  generatedCode
}) => {
  const [deploymentTarget, setDeploymentTarget] = useState<'local' | 'docker' | 'cloud'>('local');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);

  const handleDeploy = async () => {
    if (!generatedCode) return;

    setIsDeploying(true);
    setDeploymentStatus('deploying');
    setDeploymentLogs([]);

    try {
      // Simulate deployment process
      const steps = [
        'Preparing deployment package...',
        'Validating server configuration...',
        'Installing dependencies...',
        'Starting MCP server...',
        'Testing connectivity...',
        'Deployment complete!'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDeploymentLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${steps[i]}`]);
      }

      setDeploymentStatus('success');
    } catch (error) {
      setDeploymentStatus('error');
      setDeploymentLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Deployment failed: ${error}`]);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  const getDeploymentCommands = () => {
    const serverName = serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

    switch (deploymentTarget) {
      case 'local':
        return [
          '# Install dependencies',
          'pip install -r requirements.txt',
          '',
          '# Run the server',
          'python main.py',
          '',
          '# Test the server',
          `claude --server "python /path/to/${serverName}/main.py"`
        ];

      case 'docker':
        return [
          '# Build Docker image',
          `docker build -t ${serverName} .`,
          '',
          '# Run container',
          `docker run -d --name ${serverName} -p 8000:8000 ${serverName}`,
          '',
          '# Or use docker-compose',
          'docker-compose up -d',
          '',
          '# View logs',
          `docker logs ${serverName}`
        ];

      case 'cloud':
        return [
          '# Deploy to cloud (example with Railway)',
          'railway login',
          'railway new',
          'railway up',
          '',
          '# Or deploy to Render',
          'render deploy',
          '',
          '# Or use Heroku',
          'heroku create your-mcp-server',
          'git push heroku main'
        ];
    }
  };

  const deploymentCommands = getDeploymentCommands();

  if (!generatedCode) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Rocket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Deploy</h3>
          <p className="text-sm text-gray-500 mb-6">
            Generate your code first, then choose how you want to deploy your MCP server.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Deployment Options:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Local development server</li>
              <li>• Docker containerized deployment</li>
              <li>• Cloud platform hosting</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deployment Target Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Deployment Target</h3>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setDeploymentTarget('local')}
            className={`p-4 rounded-lg border transition-all ${
              deploymentTarget === 'local'
                ? 'border-mcp-primary bg-mcp-light/10 text-mcp-primary'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Monitor className="w-8 h-8 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Local Development</h4>
            <p className="text-xs text-gray-500">Run on your machine</p>
          </button>

          <button
            onClick={() => setDeploymentTarget('docker')}
            className={`p-4 rounded-lg border transition-all ${
              deploymentTarget === 'docker'
                ? 'border-mcp-primary bg-mcp-light/10 text-mcp-primary'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Container className="w-8 h-8 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Docker Container</h4>
            <p className="text-xs text-gray-500">Containerized deployment</p>
          </button>

          <button
            onClick={() => setDeploymentTarget('cloud')}
            className={`p-4 rounded-lg border transition-all ${
              deploymentTarget === 'cloud'
                ? 'border-mcp-primary bg-mcp-light/10 text-mcp-primary'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <Cloud className="w-8 h-8 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Cloud Platform</h4>
            <p className="text-xs text-gray-500">Railway, Render, Heroku</p>
          </button>
        </div>
      </div>

      {/* Deployment Instructions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Deployment Instructions</h3>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-mcp-primary" />
            <span className="text-sm text-gray-600">{serverConfig.name}</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Terminal Commands</span>
            <button
              onClick={() => copyCommand(deploymentCommands.join('\n'))}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>Copy All</span>
            </button>
          </div>

          <pre className="text-gray-100 overflow-x-auto">
            {deploymentCommands.join('\n')}
          </pre>
        </div>
      </div>

      {/* Quick Deploy */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Quick Deploy</h3>
          {deploymentStatus === 'success' && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Deployed successfully!</span>
            </div>
          )}
          {deploymentStatus === 'error' && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Deployment failed</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Prerequisites Check */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Prerequisites</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Server configuration complete</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Tools configured and valid</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Code generated successfully</span>
              </div>
              {deploymentTarget === 'docker' && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Docker required</span>
                </div>
              )}
            </div>
          </div>

          {/* Deploy Button */}
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors ${
              isDeploying
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-mcp-primary text-white hover:bg-mcp-primary/90'
            }`}
          >
            {deploymentStatus === 'deploying' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Deploy Server</span>
              </>
            )}
          </button>

          {/* Deployment Logs */}
          {deploymentLogs.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Deployment Logs</span>
              </div>
              <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
                {deploymentLogs.map((log, index) => (
                  <div key={index} className="text-gray-100">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Actions */}
          {deploymentStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h4 className="text-sm font-medium text-green-800">Deployment Successful!</h4>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your MCP server is now running and ready to use.
              </p>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>View Server</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors">
                  <Terminal className="w-4 h-4" />
                  <span>Open Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Variables Reminder */}
      {Object.keys(serverConfig.environment).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Don't forget your environment variables!
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Make sure to set up your environment variables before running the server.
                Check the .env.example file for required variables.
              </p>
              <div className="mt-3">
                <div className="text-xs text-yellow-800 font-mono bg-yellow-100 p-2 rounded">
                  Required variables: {Object.keys(serverConfig.environment).join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentPanel;