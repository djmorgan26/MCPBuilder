import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  Settings, Trash2, GripVertical, CheckCircle,
  AlertCircle, FileText, Globe, Calculator,
  Database, Mail, Image, Brain, Zap
} from 'lucide-react';
import type { Tool } from '../types';
import { ToolType } from '../types';

interface ActiveToolsProps {
  tools: Tool[];
  onEdit: (tool: Tool) => void;
  onDelete: (toolId: string) => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
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
  moveCard: (dragIndex: number, dropIndex: number) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  index,
  onEdit,
  onDelete,
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
      className={`bg-white border rounded-lg p-4 transition-all ${
        isDragging ? 'opacity-50 tool-card-dragging' : 'opacity-100'
      } ${hasErrors ? 'border-red-300' : 'border-gray-200'} hover:border-mcp-primary hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="drag-handle flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 cursor-grab"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-shrink-0">
            <IconComponent className="w-5 h-5 text-mcp-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {tool.name}
              </h3>
              {tool.isValid ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate mt-1">
              {tool.description}
            </p>
            {hasErrors && (
              <div className="mt-2">
                <p className="text-xs text-red-600 font-medium">
                  {tool.errors.length} error{tool.errors.length !== 1 ? 's' : ''}
                </p>
                <ul className="mt-1 space-y-1">
                  {tool.errors.slice(0, 2).map((error, i) => (
                    <li key={i} className="text-xs text-red-500">
                      • {error}
                    </li>
                  ))}
                  {tool.errors.length > 2 && (
                    <li className="text-xs text-red-500">
                      • +{tool.errors.length - 2} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(tool)}
            className="p-2 text-gray-400 hover:text-mcp-primary rounded-md hover:bg-mcp-light/50 transition-colors"
            title="Edit tool"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(tool.id)}
            className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
            title="Delete tool"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{tool.parameters.length} parameter{tool.parameters.length !== 1 ? 's' : ''}</span>
          <span>Returns {tool.returnType.type}</span>
          {tool.isAsync && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Async</span>}
          {tool.requiresAuth && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">Auth</span>}
        </div>
        <span>#{tool.order + 1}</span>
      </div>
    </div>
  );
};

const ActiveTools: React.FC<ActiveToolsProps> = ({
  tools,
  onEdit,
  onDelete,
  onReorder
}) => {
  const moveCard = (dragIndex: number, dropIndex: number) => {
    onReorder(dragIndex, dropIndex);
  };

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Tools Added Yet</h3>
        <p className="text-sm text-gray-500 mb-6">
          Add tools from the templates on the left to start building your MCP server.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Getting Started:</h4>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Browse tool templates in the sidebar</li>
            <li>Click on a template to add it</li>
            <li>Configure the tool parameters</li>
            <li>Drag tools to reorder them</li>
          </ol>
        </div>
      </div>
    );
  }

  const validTools = tools.filter(tool => tool.isValid);
  const invalidTools = tools.filter(tool => !tool.isValid);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Active Tools ({tools.length})
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{validTools.length} valid</span>
          </div>
          {invalidTools.length > 0 && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{invalidTools.length} with errors</span>
            </div>
          )}
        </div>
      </div>

      {invalidTools.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                {invalidTools.length} tool{invalidTools.length !== 1 ? 's' : ''} need{invalidTools.length === 1 ? 's' : ''} attention
              </h4>
              <p className="text-xs text-red-700 mt-1">
                Tools with errors won't be included in the generated code. Click the settings icon to fix them.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            moveCard={moveCard}
          />
        ))}
      </div>
    </div>
  );
};

export default ActiveTools;