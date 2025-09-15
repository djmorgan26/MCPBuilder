import React, { useState } from 'react';
import {
  FileText, Globe, Calculator, Database,
  Mail, Image, Brain, Zap, Search,
  Plus, Star, Sparkles
} from 'lucide-react';
import type { ToolTemplate } from '../types';
import { ToolType } from '../types';

interface ProductGridProps {
  onAddTool: (template: ToolTemplate) => void;
}

const templates: ToolTemplate[] = [
  {
    id: 'file-reader',
    type: ToolType.FILE_READER,
    name: 'File Reader Pro',
    description: 'Advanced file processing with support for 20+ formats including PDF, Excel, and multimedia files',
    icon: 'FileText',
    category: 'io',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['pandas', 'PyPDF2', 'python-docx', 'openpyxl']
  },
  {
    id: 'api-caller',
    type: ToolType.API_CALLER,
    name: 'API Gateway',
    description: 'Enterprise-grade HTTP client with OAuth, rate limiting, and automatic retry mechanisms',
    icon: 'Globe',
    category: 'integration',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['httpx', 'requests']
  },
  {
    id: 'calculator',
    type: ToolType.CALCULATOR,
    name: 'Math Engine',
    description: 'Scientific computing powerhouse with statistical analysis and symbolic mathematics',
    icon: 'Calculator',
    category: 'compute',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['numpy', 'scipy', 'sympy']
  },
  {
    id: 'database',
    type: ToolType.DATABASE,
    name: 'Database Connect',
    description: 'Universal database connector supporting SQL, NoSQL, and cloud data warehouses',
    icon: 'Database',
    category: 'integration',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['sqlalchemy', 'asyncpg', 'pymongo', 'mysql-connector-python']
  },
  {
    id: 'web-scraper',
    type: ToolType.WEB_SCRAPER,
    name: 'Web Scraper Elite',
    description: 'Intelligent web scraping with JavaScript rendering and anti-detection capabilities',
    icon: 'Zap',
    category: 'integration',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['beautifulsoup4', 'requests', 'selenium', 'lxml']
  },
  {
    id: 'email-sender',
    type: ToolType.EMAIL_SENDER,
    name: 'Email Studio',
    description: 'Professional email automation with templates, tracking, and delivery analytics',
    icon: 'Mail',
    category: 'integration',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: []
  },
  {
    id: 'image-processor',
    type: ToolType.IMAGE_PROCESSOR,
    name: 'Vision AI',
    description: 'Advanced image processing with OCR, object detection, and AI-powered analysis',
    icon: 'Image',
    category: 'compute',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['Pillow', 'opencv-python', 'pytesseract']
  },
  {
    id: 'text-analyzer',
    type: ToolType.TEXT_ANALYZER,
    name: 'NLP Engine',
    description: 'State-of-the-art natural language processing with sentiment analysis and translation',
    icon: 'Brain',
    category: 'compute',
    configSchema: { fields: [] },
    codeTemplate: '',
    requiredDependencies: ['spacy', 'nltk', 'transformers', 'textblob']
  }
];

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  FileText, Globe, Calculator, Database,
  Mail, Image, Brain, Zap
};

const categoryInfo = {
  io: { name: 'I/O Operations', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10' },
  compute: { name: 'Computing', color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
  integration: { name: 'Integration', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10' },
  utility: { name: 'Utility', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10' }
};

const ProductGrid: React.FC<ProductGridProps> = ({ onAddTool }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'All Products', count: templates.length },
    { id: 'io', name: 'I/O', count: templates.filter(t => t.category === 'io').length },
    { id: 'compute', name: 'Compute', count: templates.filter(t => t.category === 'compute').length },
    { id: 'integration', name: 'Integration', count: templates.filter(t => t.category === 'integration').length },
    { id: 'utility', name: 'Utility', count: templates.filter(t => t.category === 'utility').length },
  ];

  return (
    <section id="products" className="py-20 bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-card border border-dark-border rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-accent-neon" />
            <span className="text-sm font-medium text-text-secondary">
              Premium Tool Collection
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 font-apple">
            Choose Your <span className="bg-gradient-to-r from-accent-silver to-accent-neon bg-clip-text text-transparent">Power Tools</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Professional-grade components designed for enterprise applications. 
            Each tool is optimized for performance, security, and scalability.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12 space-y-6 lg:space-y-0">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-card border border-dark-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-neon focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-accent-silver to-accent-neon text-dark-bg shadow-glow'
                    : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary hover:border-accent-silver'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredTemplates.map((template, index) => {
            const IconComponent = iconMap[template.icon];
            const category = categoryInfo[template.category as keyof typeof categoryInfo];
            
            return (
              <div
                key={template.id}
                className="group bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-accent-silver transition-all duration-300 transform hover:scale-105 hover:shadow-card animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Product Image Placeholder */}
                <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-dark-surface to-dark-card">
                  <div className="aspect-square flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-glow`}>
                      <IconComponent className="w-8 h-8 text-dark-bg" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-card/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Category Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${category.bg} text-white mb-3`}>
                  {category.name}
                </div>

                {/* Product Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-text-primary mb-2 font-apple">
                    {template.name}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 text-xs text-text-tertiary">
                    <Star className="w-3 h-3 text-accent-neon" />
                    <span>Enterprise Ready</span>
                    <span>•</span>
                    <span>High Performance</span>
                    <span>•</span>
                    <span>Secure</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => onAddTool(template)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-accent-silver to-accent-neon hover:from-accent-neon hover:to-accent-silver text-dark-bg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-neon"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Build</span>
                </button>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-dark-card border border-dark-border rounded-2xl flex items-center justify-center">
              <Search className="w-12 h-12 text-text-tertiary" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">No products found</h3>
            <p className="text-text-secondary">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
