import React, { useState, useEffect } from 'react';
import {
  Save, FolderOpen, Trash2, Search, Clock,
  Plus, Download, Upload, ExternalLink
} from 'lucide-react';
import type { ServerConfig, Tool, Resource, SavedProject } from '../types/index';
import StorageService from '../utils/storageService';

interface ProjectsPanelProps {
  serverConfig: ServerConfig;
  tools: Tool[];
  resources: Resource[];
  onLoadProject: (project: SavedProject) => void;
  onProjectSaved?: (projectId: string) => void;
}

const ProjectsPanel: React.FC<ProjectsPanelProps> = ({
  serverConfig,
  tools,
  resources,
  onLoadProject,
  onProjectSaved
}) => {
  const [storageService] = useState(() => new StorageService());
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    loadAutoSave();
  }, []);

  useEffect(() => {
    // Auto-save every 30 seconds if there's data
    if (serverConfig.name || tools.length > 0) {
      const interval = setInterval(() => {
        storageService.autoSave(serverConfig, tools, resources).catch(console.error);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [serverConfig, tools, resources, storageService]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const loadedProjects = await storageService.getProjects(searchQuery || undefined);
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutoSave = async () => {
    try {
      const autoSaved = await storageService.loadAutoSave();
      if (autoSaved && (!serverConfig.name && tools.length === 0)) {
        // Only load auto-save if current state is empty
        onLoadProject(autoSaved);
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
    }
  };

  const handleSave = async () => {
    if (!serverConfig.name) {
      alert('Please enter a server name before saving');
      return;
    }

    try {
      setIsLoading(true);
      const projectId = await storageService.saveProject(
        serverConfig,
        tools,
        resources,
        currentProjectId || undefined
      );
      setCurrentProjectId(projectId);
      await loadProjects();
      onProjectSaved?.(projectId);
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (project: SavedProject) => {
    try {
      setCurrentProjectId(project.id);
      onLoadProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setIsLoading(true);
      await storageService.deleteProject(projectId);
      await loadProjects();
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadProjects();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Save */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Project Management</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isLoading || !serverConfig.name}
              className="flex items-center space-x-2 px-4 py-2 bg-mcp-primary text-white rounded-md hover:bg-mcp-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Project</span>
            </button>
          </div>
        </div>

        {currentProjectId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm">
                Current project: <strong>{serverConfig.name}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Saved Projects</h4>

        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Search
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-mcp-primary"></div>
              <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchQuery ? 'No projects found matching your search' : 'No saved projects yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Save your current project to see it here
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  currentProjectId === project.id
                    ? 'border-mcp-primary bg-mcp-light/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-gray-900">{project.name}</h5>
                      {currentProjectId === project.id && (
                        <span className="px-2 py-1 text-xs bg-mcp-primary text-white rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{project.serverConfig.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{project.tools.length} tools</span>
                      <span>{project.resources.length} resources</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLoad(project)}
                      className="p-2 text-gray-500 hover:text-mcp-primary hover:bg-gray-100 rounded-md transition-colors"
                      title="Load project"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto-save info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            Your work is automatically saved every 30 seconds
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPanel;