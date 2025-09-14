import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
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

    handleInputChange('parameters', [...editedTool.parameters, newParameter]);
  };

  const handleParameterUpdate = (index: number, updates: Partial<Parameter>) => {
    if (!editedTool) return;

    const updatedParameters = editedTool.parameters.map((param, i) =>
      i === index ? { ...param, ...updates } : param
    );

    handleInputChange('parameters', updatedParameters);
  };

  const handleParameterDelete = (index: number) => {
    if (!editedTool) return;

    const updatedParameters = editedTool.parameters.filter((_, i) => i !== index);
    handleInputChange('parameters', updatedParameters);
  };

  if (!isOpen || !editedTool) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Configure Tool: {editedTool.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Name *
                </label>
                <input
                  type="text"
                  value={editedTool.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
                  placeholder="Enter tool name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editedTool.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
                  placeholder="Describe what this tool does"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Type
                </label>
                <select
                  value={editedTool.returnType.type}
                  onChange={(e) => handleInputChange('returnType', { ...editedTool.returnType, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                  <option value="array">Array</option>
                  <option value="void">Void</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editedTool.isAsync}
                    onChange={(e) => handleInputChange('isAsync', e.target.checked)}
                    className="w-4 h-4 text-mcp-primary border-gray-300 rounded focus:ring-mcp-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Async Function</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editedTool.requiresAuth}
                    onChange={(e) => handleInputChange('requiresAuth', e.target.checked)}
                    className="w-4 h-4 text-mcp-primary border-gray-300 rounded focus:ring-mcp-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Requires Authentication</span>
                </label>
              </div>
            </div>

            {/* Parameters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Parameters</h3>
                <button
                  onClick={handleParameterAdd}
                  className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-mcp-primary hover:text-mcp-primary/80 hover:bg-mcp-light/50 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Parameter</span>
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {editedTool.parameters.map((parameter, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Parameter #{index + 1}</span>
                      <button
                        onClick={() => handleParameterDelete(index)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={parameter.name}
                          onChange={(e) => handleParameterUpdate(index, { name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcp-primary"
                          placeholder="parameter_name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Type
                        </label>
                        <select
                          value={parameter.type}
                          onChange={(e) => handleParameterUpdate(index, { type: e.target.value as any })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcp-primary"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={parameter.description}
                        onChange={(e) => handleParameterUpdate(index, { description: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcp-primary"
                        placeholder="Parameter description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Default Value
                        </label>
                        <input
                          type="text"
                          value={parameter.default || ''}
                          onChange={(e) => handleParameterUpdate(index, { default: e.target.value || undefined })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-mcp-primary"
                          placeholder="Optional default"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={parameter.required}
                            onChange={(e) => handleParameterUpdate(index, { required: e.target.checked })}
                            className="w-3 h-3 text-mcp-primary border-gray-300 rounded focus:ring-mcp-primary"
                          />
                          <span className="ml-1 text-xs text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {editedTool.parameters.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No parameters defined</p>
                    <p className="text-xs text-gray-400 mt-1">Add at least one parameter</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {errors.length === 0 ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">Tool configuration is valid</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{errors.length} error{errors.length !== 1 ? 's' : ''} to fix</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={errors.length > 0}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                errors.length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-mcp-primary text-white hover:bg-mcp-primary/90'
              }`}
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