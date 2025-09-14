import React, { useState } from 'react';
import { Plus, Folder, File, Edit, Trash2, Save, X } from 'lucide-react';
import type { Resource } from '../types';

interface ResourceManagerProps {
  resources: Resource[];
  onChange: (resources: Resource[]) => void;
}

const ResourceManager: React.FC<ResourceManagerProps> = ({ resources, onChange }) => {
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    name: '',
    uri: '',
    description: '',
    type: 'static',
    content: '',
    mimeType: 'text/plain',
    isReadOnly: false
  });

  const handleAddResource = () => {
    if (!newResource.name || !newResource.uri) return;

    const resource: Resource = {
      id: `resource-${Date.now()}`,
      name: newResource.name,
      uri: newResource.uri,
      description: newResource.description || '',
      type: newResource.type as 'static' | 'template' | 'dynamic',
      content: newResource.content,
      mimeType: newResource.mimeType || 'text/plain',
      isReadOnly: newResource.isReadOnly || false
    };

    onChange([...resources, resource]);
    setNewResource({
      name: '',
      uri: '',
      description: '',
      type: 'static',
      content: '',
      mimeType: 'text/plain',
      isReadOnly: false
    });
    setIsAddingResource(false);
  };

  const handleUpdateResource = (id: string, updates: Partial<Resource>) => {
    const updatedResources = resources.map(resource =>
      resource.id === id ? { ...resource, ...updates } : resource
    );
    onChange(updatedResources);
  };

  const handleDeleteResource = (id: string) => {
    const filteredResources = resources.filter(resource => resource.id !== id);
    onChange(filteredResources);
  };

  const mimeTypeOptions = [
    { label: 'Plain Text', value: 'text/plain' },
    { label: 'JSON', value: 'application/json' },
    { label: 'XML', value: 'text/xml' },
    { label: 'HTML', value: 'text/html' },
    { label: 'CSV', value: 'text/csv' },
    { label: 'Markdown', value: 'text/markdown' },
    { label: 'YAML', value: 'text/yaml' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-mcp-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
        </div>
        <button
          onClick={() => setIsAddingResource(true)}
          className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-mcp-primary hover:text-mcp-primary/80 hover:bg-mcp-light/50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Add Resource Form */}
      {isAddingResource && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm"
                  placeholder="Resource name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URI *
                </label>
                <input
                  type="text"
                  value={newResource.uri}
                  onChange={(e) => setNewResource({ ...newResource, uri: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm"
                  placeholder="resource://path/to/resource"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm"
                placeholder="Resource description"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm"
                >
                  <option value="static">Static</option>
                  <option value="template">Template</option>
                  <option value="dynamic">Dynamic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MIME Type
                </label>
                <select
                  value={newResource.mimeType}
                  onChange={(e) => setNewResource({ ...newResource, mimeType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm"
                >
                  {mimeTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newResource.isReadOnly}
                    onChange={(e) => setNewResource({ ...newResource, isReadOnly: e.target.checked })}
                    className="w-4 h-4 text-mcp-primary border-gray-300 rounded focus:ring-mcp-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Read Only</span>
                </label>
              </div>
            </div>

            {newResource.type === 'static' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={newResource.content}
                  onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm font-mono"
                  placeholder="Enter resource content..."
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                setIsAddingResource(false);
                setNewResource({
                  name: '',
                  uri: '',
                  description: '',
                  type: 'static',
                  content: '',
                  mimeType: 'text/plain',
                  isReadOnly: false
                });
              }}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddResource}
              disabled={!newResource.name || !newResource.uri}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                !newResource.name || !newResource.uri
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-mcp-primary text-white hover:bg-mcp-primary/90'
              }`}
            >
              Add Resource
            </button>
          </div>
        </div>
      )}

      {/* Resources List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-mcp-primary hover:bg-mcp-light/10 transition-all"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <File className="w-5 h-5 text-mcp-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {resource.name}
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    resource.type === 'static' ? 'bg-blue-100 text-blue-800' :
                    resource.type === 'template' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {resource.type}
                  </span>
                  {resource.isReadOnly && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      Read Only
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {resource.uri}
                </p>
                {resource.description && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {resource.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingResourceId(resource.id)}
                className="p-2 text-gray-400 hover:text-mcp-primary rounded-md hover:bg-mcp-light/50 transition-colors"
                title="Edit resource"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDeleteResource(resource.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                title="Delete resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {resources.length === 0 && !isAddingResource && (
          <div className="text-center py-12 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No Resources</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add resources that your MCP server can provide to clients.
            </p>
            <button
              onClick={() => setIsAddingResource(true)}
              className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-mcp-primary bg-mcp-light hover:bg-mcp-light/80 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Resource</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceManager;