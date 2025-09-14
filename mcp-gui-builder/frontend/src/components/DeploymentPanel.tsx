import React, { useState } from 'react';
import {
  Rocket, Cloud, Monitor, Download,
  CheckCircle, AlertTriangle, ExternalLink,
  Copy, Terminal, Package, Play, Container
} from 'lucide-react';
import type { ServerConfig, GeneratedCode, DeploymentConfig } from '../types/index';

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
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentEndpoint, setDeploymentEndpoint] = useState<string | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  const handleDeploy = async () => {
    if (!generatedCode) return;

    setIsDeploying(true);
    setDeploymentStatus('deploying');
    setDeploymentLogs([]);
    setDeploymentProgress(0);

    try {
      const deploymentConfig: DeploymentConfig = {
        target: deploymentTarget,
        dockerConfig: deploymentTarget === 'docker' ? {
          imageName: serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(),
          tag: 'latest',
          baseImage: `python:${serverConfig.pythonVersion}-slim`,
          exposePort: 8000,
          volumes: [],
          envFile: Object.keys(serverConfig.environment).length > 0
        } : undefined
      };

      // Start deployment
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverConfig,
          generatedCode,
          deploymentConfig
        })
      });

      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }

      const result = await response.json();
      const deploymentId = result.data.deploymentId;
      setDeploymentId(deploymentId);

      // Poll for deployment status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/deploy/${deploymentId}`);
          if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            const deployment = statusResult.data;

            setDeploymentProgress(deployment.progress || 0);
            setDeploymentLogs(deployment.logs || []);

            if (deployment.status === 'running') {
              setDeploymentStatus('success');
              setDeploymentEndpoint(deployment.endpoint);
              clearInterval(pollInterval);
              setIsDeploying(false);
            } else if (deployment.status === 'failed') {
              setDeploymentStatus('error');
              clearInterval(pollInterval);
              setIsDeploying(false);
            }
          }
        } catch (error) {
          console.error('Error polling deployment status:', error);
        }
      }, 1000);

      // Cleanup interval after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);

    } catch (error) {
      setDeploymentStatus('error');
      setDeploymentLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - Deployment failed: ${error}`]);
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

          {/* Progress Bar */}
          {deploymentStatus === 'deploying' && (
            <div className="bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-mcp-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${deploymentProgress}%` }}
              />
              <div className="text-xs text-gray-600 mt-1 text-center">
                {deploymentProgress}% complete
              </div>
            </div>
          )}

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
                Your MCP server is now running at: {deploymentEndpoint}
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => deploymentEndpoint && window.open(deploymentEndpoint, '_blank')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Server</span>
                </button>
                <button
                  onClick={() => copyCommand(deploymentEndpoint || '')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Endpoint</span>
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

      {/* Docker Connection Setup */}
      {deploymentStatus === 'success' && deploymentEndpoint && deploymentTarget === 'docker' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Container className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Docker Container Ready</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Your MCP server is running in a Docker container. Use these commands to interact with it.
          </p>

          <div className="space-y-4">
            {/* Claude Desktop Configuration */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Claude Desktop Configuration</h4>
              <p className="text-xs text-gray-600 mb-2">Add this to your Claude Desktop configuration:</p>
              <div className="bg-gray-900 rounded p-3 font-mono text-xs mb-3">
                <pre className="text-gray-100 whitespace-pre-wrap">
{JSON.stringify({
  "mcpServers": {
    [serverConfig.name]: {
      "command": "docker",
      "args": ["exec", "-i", serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(), "python", "main.py"]
    }
  }
}, null, 2)}
                </pre>
              </div>
              <button
                onClick={() => copyCommand(JSON.stringify({
                  "mcpServers": {
                    [serverConfig.name]: {
                      "command": "docker",
                      "args": ["exec", "-i", serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase(), "python", "main.py"]
                    }
                  }
                }, null, 2))}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Claude Configuration</span>
              </button>
            </div>

            {/* Direct Docker Commands */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Docker Commands</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Connect to server:</label>
                  <div className="bg-gray-900 rounded p-2 font-mono text-xs">
                    <span className="text-gray-100">docker exec -it {serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()} python main.py</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">View logs:</label>
                  <div className="bg-gray-900 rounded p-2 font-mono text-xs">
                    <span className="text-gray-100">docker logs {serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Stop container:</label>
                  <div className="bg-gray-900 rounded p-2 font-mono text-xs">
                    <span className="text-gray-100">docker stop {serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => copyCommand(`docker exec -it ${serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()} python main.py`)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Connect</span>
                </button>
                <button
                  onClick={() => copyCommand(`docker logs ${serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Logs</span>
                </button>
              </div>
            </div>

            {/* Container Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Container Information</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>Container ID: <code className="bg-blue-100 px-1 rounded">{deploymentId}</code></div>
                <div>Endpoint: <code className="bg-blue-100 px-1 rounded">{deploymentEndpoint}</code></div>
                <div>Image: <code className="bg-blue-100 px-1 rounded">{serverConfig.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}:latest</code></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Local Deployment Connection */}
      {deploymentStatus === 'success' && deploymentEndpoint && deploymentTarget === 'local' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Monitor className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Local Server Ready</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Your MCP server is running locally. Use this configuration to connect.
          </p>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Claude Desktop Configuration</h4>
            <div className="bg-gray-900 rounded p-3 font-mono text-xs mb-3">
              <pre className="text-gray-100 whitespace-pre-wrap">
{JSON.stringify({
  "mcpServers": {
    [serverConfig.name]: {
      "command": "python",
      "args": [deploymentEndpoint?.replace('stdio:', '') || '']
    }
  }
}, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => copyCommand(JSON.stringify({
                "mcpServers": {
                  [serverConfig.name]: {
                    "command": "python",
                    "args": [deploymentEndpoint?.replace('stdio:', '') || '']
                  }
                }
              }, null, 2))}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Configuration</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentPanel;