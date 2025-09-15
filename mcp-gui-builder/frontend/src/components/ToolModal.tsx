import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import type { Tool, Parameter, ConfigField } from '../types';

interface ToolModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onSave: (tool: Tool) => void;
  onClose: () => void;
}

const ToolModal: React.FC<ToolModalProps> = ({ tool, isOpen, onSave, onClose }) => {
  const [editedTool, setEditedTool] = useState<Tool | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (tool) {
      setEditedTool({ ...tool });
      validateTool(tool);
    } else {
      setEditedTool(null);
      setErrors([]);
    }
  }, [tool]);

  const validateTool = (toolToValidate: Tool) => {
    const newErrors: string[] = [];

    if (!toolToValidate.name.trim()) {
      newErrors.push('Tool name is required');
    }

    if (!toolToValidate.description.trim()) {
      newErrors.push('Tool description is required');
    }

    if (toolToValidate.parameters.length === 0) {
      newErrors.push('At least one parameter is required');
    }

    toolToValidate.parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        newErrors.push(`Parameter ${index + 1}: Name is required`);
      }
      if (!param.description.trim()) {
        newErrors.push(`Parameter ${index + 1}: Description is required`);
      }
    });

    setErrors(newErrors);
    const updatedTool = {
      ...toolToValidate,
      isValid: newErrors.length === 0,
      errors: newErrors
    };
    setEditedTool(updatedTool);
  };

  const handleSave = () => {
    if (editedTool && errors.length === 0) {
      onSave(editedTool);
    }
  };

  const handleInputChange = (field: keyof Tool, value: any) => {
    if (!editedTool) return;

    const updatedTool = { ...editedTool, [field]: value };
    validateTool(updatedTool);
  };

  const handleParameterAdd = () => {
    if (!editedTool) return;

    const newParameter: Parameter = {
      name: `param_${editedTool.parameters.length + 1}`,
      type: 'string',
      description: '',
      required: true,
      default: undefined
    };

    const updatedParameters = [...editedTool.parameters, newParameter];
    handleInputChange('parameters', updatedParameters);
  };

  const handleParameterChange = (index: number, field: keyof Parameter, value: any) => {
    if (!editedTool) return;

    const updatedParameters = [...editedTool.parameters];
    updatedParameters[index] = { ...updatedParameters[index], [field]: value };
    handleInputChange('parameters', updatedParameters);
  };

  const handleParameterRemove = (index: number) => {
    if (!editedTool) return;

    const updatedParameters = editedTool.parameters.filter((_, i) => i !== index);
    handleInputChange('parameters', updatedParameters);
  };

  if (!isOpen || !editedTool) return null;

  return (
    <div className="fixed inset-0 bg-dark-bg bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-card border border-dark-border rounded-2xl shadow-card max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-silver to-accent-neon rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-dark-bg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary font-apple">
                Configure Tool: {editedTool.name}
              </h2>
              <p className="text-sm text-text-secondary">
                {editedTool.isValid ? 'Ready to save' : `${errors.length} errors to fix`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-dark-surface transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Basic Configuration */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4 font-apple flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-accent-neon" />
                  <span>Basic Configuration</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Tool Name *
                    </label>
                    <input
                      type="text"
                      value={editedTool.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                      placeholder="Enter tool name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Description *
                    </label>
                    <textarea
                      value={editedTool.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Describe what this tool does"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Return Type
                    </label>
                    <select
                      value={editedTool.returnType.type}
                      onChange={(e) => handleInputChange('returnType', { ...editedTool.returnType, type: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="object">Object</option>
                      <option value="array">Array</option>
                      <option value="void">Void</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg border border-dark-border hover:border-accent-silver transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedTool.isAsync}
                        onChange={(e) => handleInputChange('isAsync', e.target.checked)}
                        className="w-4 h-4 text-accent-neon bg-dark-card border-dark-border rounded focus:ring-accent-neon"
                      />
                      <div>
                        <div className="text-sm font-medium text-text-primary">Async Function</div>
                        <div className="text-xs text-text-tertiary">Non-blocking execution</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-dark-surface rounded-lg border border-dark-border hover:border-accent-silver transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedTool.requiresAuth}
                        onChange={(e) => handleInputChange('requiresAuth', e.target.checked)}
                        className="w-4 h-4 text-accent-neon bg-dark-card border-dark-border rounded focus:ring-accent-neon"
                      />
                      <div>
                        <div className="text-sm font-medium text-text-primary">Requires Auth</div>
                        <div className="text-xs text-text-tertiary">Authentication needed</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Tool Configuration */}
            {editedTool.type !== 'custom' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary font-apple flex items-center space-x-2 mb-4">
                    <Settings className="w-5 h-5 text-accent-neon" />
                    <span>Easy Configuration</span>
                  </h3>
                  
                  <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-neon to-accent-purple rounded-xl flex items-center justify-center flex-shrink-0">
                        <Settings className="w-5 h-5 text-dark-bg" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-md font-semibold text-text-primary mb-2">
                          Smart Defaults & Easy Options
                        </h4>
                        <p className="text-sm text-text-secondary mb-4">
                          This tool comes with pre-configured settings and dropdown options. 
                          No need to manually set up complex parameters!
                        </p>
                        
                        <div className="bg-dark-card rounded-lg p-4 border border-dark-border">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-2 h-2 bg-status-success rounded-full"></div>
                            <span className="text-sm font-medium text-text-primary">Pre-configured</span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            Smart defaults are automatically applied. You can customize specific options below if needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parameters */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary font-apple flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-accent-purple" />
                    <span>Parameters</span>
                  </h3>
                  <button
                    onClick={handleParameterAdd}
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Parameter</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {editedTool.parameters.map((param, index) => (
                    <div key={index} className="bg-dark-surface rounded-lg p-4 border border-dark-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-text-primary">
                          Parameter {index + 1}
                        </span>
                        <button
                          onClick={() => handleParameterRemove(index)}
                          className="p-1 text-text-tertiary hover:text-status-error rounded hover:bg-status-error/10 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent text-sm"
                            placeholder="parameter_name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">
                            Type
                          </label>
                          <select
                            value={param.type}
                            onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent text-sm"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="object">Object</option>
                            <option value="array">Array</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Description *
                        </label>
                        <input
                          type="text"
                          value={param.description}
                          onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent text-sm"
                          placeholder="Describe this parameter"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => handleParameterChange(index, 'required', e.target.checked)}
                            className="w-4 h-4 text-accent-neon bg-dark-card border-dark-border rounded focus:ring-accent-neon"
                          />
                          <span className="text-xs text-text-secondary">Required</span>
                        </label>
                        {param.default !== undefined && (
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              Default Value
                            </label>
                            <input
                              type="text"
                              value={param.default || ''}
                              onChange={(e) => handleParameterChange(index, 'default', e.target.value)}
                              className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent text-sm"
                              placeholder="Default value"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {editedTool.parameters.length === 0 && (
                    <div className="text-center py-8 text-text-tertiary">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
                      <p className="text-sm">No parameters added yet</p>
                      <p className="text-xs mt-1">Click "Add Parameter" to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-status-error" />
                <h4 className="text-sm font-semibold text-status-error">
                  {errors.length} error{errors.length !== 1 ? 's' : ''} to fix
                </h4>
              </div>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-status-error">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-border">
          <div className="flex items-center space-x-2">
            {editedTool.isValid ? (
              <div className="flex items-center space-x-2 text-status-success">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ready to save</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-status-error">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{errors.length} errors</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editedTool.isValid}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver disabled:from-dark-muted disabled:to-dark-muted disabled:text-text-tertiary text-dark-bg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>Save Tool</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolModal;