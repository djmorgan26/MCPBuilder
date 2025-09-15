import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  Settings, Trash2, GripVertical, Save,
  AlertCircle, FileText, Globe, Calculator,
  Database, Mail, Image, Brain, Zap,
  Sparkles
} from 'lucide-react';
import type { Tool } from '../types';
import { ToolType } from '../types';

interface ConfiguratorProps {
  tools: Tool[];
  onEdit: (tool: Tool) => void;
  onDelete: (toolId: string) => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onSaveTool?: (tool: Tool) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const iconMap: Record<ToolType, React.FC<{ className?: string }>> = {
  [ToolType.FILE_READER]: FileText,
  [ToolType.API_CALLER]: Globe,
  [ToolType.CALCULATOR]: Calculator,
  [ToolType.DATABASE]: Database,
  [ToolType.WEB_SCRAPER]: Zap,
  [ToolType.EMAIL_SENDER]: Mail,
  [ToolType.IMAGE_PROCESSOR]: Image,
  [ToolType.TEXT_ANALYZER]: Brain,
  [ToolType.CUSTOM]: Settings
};

interface ToolCardProps {
  tool: Tool;
  index: number;
  onEdit: (tool: Tool) => void;
  onDelete: (toolId: string) => void;
  onSave?: (tool: Tool) => void;
  moveCard: (dragIndex: number, dropIndex: number) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  index,
  onEdit,
  onDelete,
  onSave,
  moveCard
}) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'tool',
    item: (): DragItem => ({
      id: tool.id,
      index,
      type: 'tool'
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'tool',
    hover(item: DragItem) {
      if (!drag) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const IconComponent = iconMap[tool.type];
  const hasErrors = tool.errors.length > 0;

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={`group relative bg-dark-card border rounded-2xl p-6 transition-all duration-300 hover:border-accent-silver hover:shadow-card transform hover:scale-[1.02] ${
        isDragging ? 'opacity-50 rotate-2' : 'opacity-100'
      } ${hasErrors ? 'border-status-error/50' : 'border-dark-border'}`}
    >
      {/* Drag Handle */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-8 h-8 bg-dark-surface border border-dark-border rounded-lg flex items-center justify-center cursor-grab hover:bg-dark-muted">
          <GripVertical className="w-4 h-4 text-text-tertiary" />
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        {tool.isValid ? (
          <div className="w-3 h-3 bg-status-success rounded-full shadow-glow"></div>
        ) : (
          <div className="w-3 h-3 bg-status-error rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Tool Icon */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-accent-silver to-accent-neon rounded-xl flex items-center justify-center shadow-glow">
          <IconComponent className="w-6 h-6 text-dark-bg" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-text-primary font-apple">
            {tool.name}
          </h3>
          <p className="text-sm text-text-secondary">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Tool Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-dark-surface rounded-lg p-3">
          <div className="text-xs text-text-tertiary mb-1">Parameters</div>
          <div className="text-lg font-semibold text-text-primary">
            {tool.parameters.length}
          </div>
        </div>
        <div className="bg-dark-surface rounded-lg p-3">
          <div className="text-xs text-text-tertiary mb-1">Return Type</div>
          <div className="text-lg font-semibold text-text-primary">
            {tool.returnType.type}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tool.isAsync && (
          <span className="px-2 py-1 bg-accent-neon/20 text-accent-neon text-xs font-medium rounded-full">
            Async
          </span>
        )}
        {tool.requiresAuth && (
          <span className="px-2 py-1 bg-accent-purple/20 text-accent-purple text-xs font-medium rounded-full">
            Auth Required
          </span>
        )}
        <span className="px-2 py-1 bg-dark-surface text-text-secondary text-xs font-medium rounded-full">
          #{tool.order + 1}
        </span>
      </div>

      {/* Error Display */}
      {hasErrors && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-status-error" />
            <span className="text-sm font-medium text-status-error">
              {tool.errors.length} error{tool.errors.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ul className="space-y-1">
            {tool.errors.slice(0, 2).map((error, i) => (
              <li key={i} className="text-xs text-status-error">
                • {error}
              </li>
            ))}
            {tool.errors.length > 2 && (
              <li className="text-xs text-status-error">
                • +{tool.errors.length - 2} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(tool)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
          
          {onSave && tool.isValid && (
            <button
              onClick={() => onSave(tool)}
              className="flex items-center space-x-2 px-3 py-2 bg-dark-surface border border-dark-border text-text-primary hover:border-accent-purple hover:text-accent-purple rounded-lg transition-all duration-200"
              title="Save this tool"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}
        </div>
        
        <button
          onClick={() => onDelete(tool.id)}
          className="p-2 text-text-tertiary hover:text-status-error rounded-lg hover:bg-status-error/10 transition-all duration-200"
          title="Remove tool"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Configurator: React.FC<ConfiguratorProps> = ({
  tools,
  onEdit,
  onDelete,
  onReorder,
  onSaveTool
}) => {
  const moveCard = (dragIndex: number, dropIndex: number) => {
    onReorder(dragIndex, dropIndex);
  };

  if (tools.length === 0) {
    return (
      <section id="configurator" className="py-20 bg-dark-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-32 h-32 mx-auto mb-8 bg-dark-card border border-dark-border rounded-3xl flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-accent-neon" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 font-apple">
            Your <span className="bg-gradient-to-r from-accent-silver to-accent-neon bg-clip-text text-transparent">Build Studio</span>
          </h2>
          
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Start building your custom MCP server by adding tools from our premium collection. 
            Each tool is a professional-grade component ready for enterprise deployment.
          </p>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Getting Started:</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-accent-silver to-accent-neon rounded-full flex items-center justify-center text-dark-bg font-bold text-sm">1</div>
                <span className="text-text-secondary">Browse our premium tool collection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-accent-silver to-accent-neon rounded-full flex items-center justify-center text-dark-bg font-bold text-sm">2</div>
                <span className="text-text-secondary">Click "Add to Build" on desired tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-accent-silver to-accent-neon rounded-full flex items-center justify-center text-dark-bg font-bold text-sm">3</div>
                <span className="text-text-secondary">Configure each tool's parameters</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-accent-silver to-accent-neon rounded-full flex items-center justify-center text-dark-bg font-bold text-sm">4</div>
                <span className="text-text-secondary">Deploy your professional server</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const validTools = tools.filter(tool => tool.isValid);
  const invalidTools = tools.filter(tool => !tool.isValid);

  return (
    <section id="configurator" className="py-20 bg-dark-surface">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 font-apple">
              Build <span className="bg-gradient-to-r from-accent-silver to-accent-neon bg-clip-text text-transparent">Configurator</span>
            </h2>
            <p className="text-xl text-text-secondary">
              Configure your professional MCP server components
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{tools.length}</div>
              <div className="text-sm text-text-tertiary">Total Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-success">{validTools.length}</div>
              <div className="text-sm text-text-tertiary">Configured</div>
            </div>
            {invalidTools.length > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-status-error">{invalidTools.length}</div>
                <div className="text-sm text-text-tertiary">Need Attention</div>
              </div>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {invalidTools.length > 0 && (
          <div className="mb-8 p-6 bg-status-error/10 border border-status-error/20 rounded-2xl">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-status-error flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-status-error mb-1">
                  {invalidTools.length} tool{invalidTools.length !== 1 ? 's' : ''} need{invalidTools.length === 1 ? 's' : ''} configuration
                </h3>
                <p className="text-text-secondary">
                  Configure these tools to ensure they work properly in your deployment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onSave={onSaveTool}
              moveCard={moveCard}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Configurator;
