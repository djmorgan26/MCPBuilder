import React, { useState } from 'react';
import {
  FileText, Globe, Calculator, Database,
  Mail, Image, Code,
  Brain, MessageSquare, Search, Zap,
  Filter
} from 'lucide-react';
import type { ToolTemplate } from '../types';
import { ToolType } from '../types';

interface ToolTemplatesProps {
  onAddTool: (template: ToolTemplate) => void;
}

const templates: ToolTemplate[] = [
  {
    id: 'file-reader',
    type: ToolType.FILE_READER,
    name: 'File Reader',
    description: 'Read and process various file types',
    icon: 'FileText',
    category: 'io',
    configSchema: {
      fields: [
        {
          name: 'fileTypes',
          label: 'Supported File Types',
          type: 'multiselect',
          defaultValue: ['.txt', '.json', '.csv'],
          options: [
            { label: 'Text (.txt)', value: '.txt' },
            { label: 'JSON (.json)', value: '.json' },
            { label: 'CSV (.csv)', value: '.csv' },
            { label: 'PDF (.pdf)', value: '.pdf' },
            { label: 'Word (.docx)', value: '.docx' },
            { label: 'Excel (.xlsx)', value: '.xlsx' }
          ],
          required: true,
          helpText: 'Select which file types this tool can read'
        },
        {
          name: 'maxFileSize',
          label: 'Max File Size (MB)',
          type: 'number',
          defaultValue: 10,
          validation: { type: 'max', value: 100, message: 'Max size is 100MB' }
        },
        {
          name: 'encoding',
          label: 'Default Encoding',
          type: 'select',
          defaultValue: 'utf-8',
          options: [
            { label: 'UTF-8', value: 'utf-8' },
            { label: 'ASCII', value: 'ascii' },
            { label: 'Latin-1', value: 'latin-1' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['pandas', 'PyPDF2', 'python-docx', 'openpyxl']
  },
  {
    id: 'api-caller',
    type: ToolType.API_CALLER,
    name: 'API Caller',
    description: 'Make HTTP requests to external APIs',
    icon: 'Globe',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'baseUrl',
          label: 'Base API URL',
          type: 'string',
          required: true,
          validation: { type: 'pattern', value: /^https?:\/\//, message: 'Must be a valid URL' }
        },
        {
          name: 'authType',
          label: 'Authentication Type',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'API Key', value: 'apikey' },
            { label: 'Bearer Token', value: 'bearer' },
            { label: 'Basic Auth', value: 'basic' },
            { label: 'OAuth 2.0', value: 'oauth2' }
          ]
        },
        {
          name: 'timeout',
          label: 'Request Timeout (seconds)',
          type: 'number',
          defaultValue: 30
        },
        {
          name: 'retryAttempts',
          label: 'Retry Attempts',
          type: 'number',
          defaultValue: 3
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['httpx', 'requests']
  },
  {
    id: 'calculator',
    type: ToolType.CALCULATOR,
    name: 'Calculator',
    description: 'Perform mathematical operations',
    icon: 'Calculator',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'operations',
          label: 'Supported Operations',
          type: 'multiselect',
          defaultValue: ['basic', 'scientific'],
          options: [
            { label: 'Basic (+, -, *, /)', value: 'basic' },
            { label: 'Scientific (sin, cos, log, etc.)', value: 'scientific' },
            { label: 'Statistical', value: 'statistical' },
            { label: 'Matrix Operations', value: 'matrix' },
            { label: 'Symbolic Math', value: 'symbolic' }
          ]
        },
        {
          name: 'precision',
          label: 'Decimal Precision',
          type: 'number',
          defaultValue: 10
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['numpy', 'scipy', 'sympy']
  },
  {
    id: 'database',
    type: ToolType.DATABASE,
    name: 'Database Query',
    description: 'Query SQL databases',
    icon: 'Database',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'dbType',
          label: 'Database Type',
          type: 'select',
          required: true,
          options: [
            { label: 'SQLite', value: 'sqlite' },
            { label: 'PostgreSQL', value: 'postgresql' },
            { label: 'MySQL', value: 'mysql' },
            { label: 'MongoDB', value: 'mongodb' }
          ]
        },
        {
          name: 'connectionString',
          label: 'Connection String (use env var)',
          type: 'string',
          defaultValue: '${DATABASE_URL}',
          helpText: 'Use environment variables for security'
        },
        {
          name: 'maxConnections',
          label: 'Max Connections',
          type: 'number',
          defaultValue: 5
        },
        {
          name: 'queryTimeout',
          label: 'Query Timeout (seconds)',
          type: 'number',
          defaultValue: 30
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['sqlalchemy', 'asyncpg', 'pymongo', 'mysql-connector-python']
  },
  {
    id: 'web-scraper',
    type: ToolType.WEB_SCRAPER,
    name: 'Web Scraper',
    description: 'Extract data from websites',
    icon: 'Zap',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'userAgent',
          label: 'User Agent',
          type: 'string',
          defaultValue: 'Mozilla/5.0 (MCP Bot)'
        },
        {
          name: 'respectRobotsTxt',
          label: 'Respect robots.txt',
          type: 'boolean',
          defaultValue: true
        },
        {
          name: 'rateLimit',
          label: 'Rate Limit (requests/second)',
          type: 'number',
          defaultValue: 1
        },
        {
          name: 'javascriptEnabled',
          label: 'JavaScript Rendering',
          type: 'boolean',
          defaultValue: false,
          helpText: 'Use Selenium for JavaScript-heavy sites'
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['beautifulsoup4', 'requests', 'selenium', 'lxml']
  },
  {
    id: 'email-sender',
    type: ToolType.EMAIL_SENDER,
    name: 'Email Sender',
    description: 'Send emails via SMTP',
    icon: 'Mail',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'smtpHost',
          label: 'SMTP Host',
          type: 'string',
          required: true
        },
        {
          name: 'smtpPort',
          label: 'SMTP Port',
          type: 'number',
          defaultValue: 587
        },
        {
          name: 'useTLS',
          label: 'Use TLS',
          type: 'boolean',
          defaultValue: true
        },
        {
          name: 'fromAddress',
          label: 'From Address',
          type: 'string',
          required: true
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: []
  },
  {
    id: 'image-processor',
    type: ToolType.IMAGE_PROCESSOR,
    name: 'Image Processor',
    description: 'Process and analyze images',
    icon: 'Image',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'operations',
          label: 'Supported Operations',
          type: 'multiselect',
          defaultValue: ['resize', 'format'],
          options: [
            { label: 'Resize', value: 'resize' },
            { label: 'Format Conversion', value: 'format' },
            { label: 'Filters', value: 'filters' },
            { label: 'OCR', value: 'ocr' },
            { label: 'Face Detection', value: 'face' },
            { label: 'Object Detection', value: 'object' }
          ]
        },
        {
          name: 'maxImageSize',
          label: 'Max Image Size (MB)',
          type: 'number',
          defaultValue: 10
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['Pillow', 'opencv-python', 'pytesseract']
  },
  {
    id: 'text-analyzer',
    type: ToolType.TEXT_ANALYZER,
    name: 'Text Analyzer',
    description: 'Analyze and process text with NLP',
    icon: 'Brain',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'features',
          label: 'Analysis Features',
          type: 'multiselect',
          defaultValue: ['sentiment', 'summary'],
          options: [
            { label: 'Sentiment Analysis', value: 'sentiment' },
            { label: 'Summarization', value: 'summary' },
            { label: 'Named Entity Recognition', value: 'ner' },
            { label: 'Language Detection', value: 'language' },
            { label: 'Keyword Extraction', value: 'keywords' },
            { label: 'Translation', value: 'translate' }
          ]
        },
        {
          name: 'model',
          label: 'NLP Model',
          type: 'select',
          defaultValue: 'spacy',
          options: [
            { label: 'spaCy', value: 'spacy' },
            { label: 'NLTK', value: 'nltk' },
            { label: 'Transformers', value: 'transformers' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['spacy', 'nltk', 'transformers', 'textblob']
  }
];

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  FileText, Globe, Calculator, Database,
  Mail, Image, Code,
  Brain, MessageSquare, Search, Zap
};

const categoryColors = {
  io: 'bg-blue-100 text-blue-800',
  compute: 'bg-green-100 text-green-800',
  integration: 'bg-purple-100 text-purple-800',
  utility: 'bg-orange-100 text-orange-800'
};

const ToolTemplates: React.FC<ToolTemplatesProps> = ({ onAddTool }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'All Tools', count: templates.length },
    { id: 'io', name: 'I/O', count: templates.filter(t => t.category === 'io').length },
    { id: 'compute', name: 'Compute', count: templates.filter(t => t.category === 'compute').length },
    { id: 'integration', name: 'Integration', count: templates.filter(t => t.category === 'integration').length },
    { id: 'utility', name: 'Utility', count: templates.filter(t => t.category === 'utility').length },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-mcp-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Tool Templates</h2>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mcp-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-mcp-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {filteredTemplates.map(template => {
            const IconComponent = iconMap[template.icon];
            return (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-mcp-primary hover:bg-mcp-light/10 transition-all cursor-pointer group"
                onClick={() => onAddTool(template)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-mcp-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[template.category]}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button className="px-3 py-1 text-xs font-medium text-mcp-primary bg-mcp-light/50 hover:bg-mcp-light rounded-md transition-colors opacity-0 group-hover:opacity-100">
                    Add Tool
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No tools found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolTemplates;