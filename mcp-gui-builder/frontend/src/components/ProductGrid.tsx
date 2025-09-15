import React, { useState } from 'react';
import {
  FileText, Globe, Calculator, Database,
  Mail, Image, Brain, Zap, Search,
  Plus, Star, Sparkles, Clock, 
  BarChart3, Shield, Code, Palette,
  Music, Video, MapPin, Cloud,
  Lock, Users, Wifi, Camera,
  FileSpreadsheet, FileImage, FileVideo,
  MessageSquare, Calendar, CreditCard,
  ShoppingCart, Truck, Package,
  Activity
} from 'lucide-react';
import type { ToolTemplate } from '../types';
import { ToolType } from '../types';

interface ProductGridProps {
  onAddTool: (template: ToolTemplate) => void;
}

const templates: ToolTemplate[] = [
  // I/O Operations
  {
    id: 'file-reader',
    type: ToolType.FILE_READER,
    name: 'File Reader Pro',
    description: 'Advanced file processing with support for 20+ formats including PDF, Excel, and multimedia files',
    icon: 'FileText',
    category: 'io',
    configSchema: {
      fields: [
        {
          name: 'supported_formats',
          label: 'Supported File Formats',
          type: 'multiselect',
          defaultValue: ['pdf', 'docx', 'xlsx', 'csv', 'txt'],
          required: true,
          options: [
            { label: 'PDF', value: 'pdf' },
            { label: 'Word Document', value: 'docx' },
            { label: 'Excel Spreadsheet', value: 'xlsx' },
            { label: 'CSV', value: 'csv' },
            { label: 'Text File', value: 'txt' },
            { label: 'JSON', value: 'json' },
            { label: 'XML', value: 'xml' },
            { label: 'PowerPoint', value: 'pptx' },
            { label: 'Markdown', value: 'md' },
            { label: 'HTML', value: 'html' }
          ]
        },
        {
          name: 'encoding',
          label: 'Text Encoding',
          type: 'select',
          defaultValue: 'utf-8',
          required: true,
          options: [
            { label: 'UTF-8', value: 'utf-8' },
            { label: 'ASCII', value: 'ascii' },
            { label: 'Latin-1', value: 'latin-1' },
            { label: 'Windows-1252', value: 'windows-1252' }
          ]
        },
        {
          name: 'max_file_size',
          label: 'Maximum File Size (MB)',
          type: 'select',
          defaultValue: '50',
          required: true,
          options: [
            { label: '10 MB', value: '10' },
            { label: '50 MB', value: '50' },
            { label: '100 MB', value: '100' },
            { label: '500 MB', value: '500' },
            { label: '1 GB', value: '1000' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['pandas', 'PyPDF2', 'python-docx', 'openpyxl']
  },
  {
    id: 'file-writer',
    type: ToolType.FILE_READER,
    name: 'File Writer Studio',
    description: 'Professional file writing with format conversion, compression, and batch processing',
    icon: 'FileSpreadsheet',
    category: 'io',
    configSchema: {
      fields: [
        {
          name: 'output_formats',
          label: 'Output Formats',
          type: 'multiselect',
          defaultValue: ['json', 'csv', 'xlsx'],
          required: true,
          options: [
            { label: 'JSON', value: 'json' },
            { label: 'CSV', value: 'csv' },
            { label: 'Excel', value: 'xlsx' },
            { label: 'XML', value: 'xml' },
            { label: 'PDF', value: 'pdf' },
            { label: 'Text', value: 'txt' },
            { label: 'Markdown', value: 'md' }
          ]
        },
        {
          name: 'compression',
          label: 'Enable Compression',
          type: 'select',
          defaultValue: 'none',
          required: true,
          options: [
            { label: 'None', value: 'none' },
            { label: 'Gzip', value: 'gzip' },
            { label: 'Zip', value: 'zip' },
            { label: '7zip', value: '7zip' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['pandas', 'openpyxl', 'reportlab']
  },
  {
    id: 'image-reader',
    type: ToolType.IMAGE_PROCESSOR,
    name: 'Image Reader',
    description: 'Smart image file processing with metadata extraction and format detection',
    icon: 'FileImage',
    category: 'io',
    configSchema: {
      fields: [
        {
          name: 'image_formats',
          label: 'Supported Image Formats',
          type: 'multiselect',
          defaultValue: ['jpg', 'png', 'gif', 'bmp'],
          required: true,
          options: [
            { label: 'JPEG', value: 'jpg' },
            { label: 'PNG', value: 'png' },
            { label: 'GIF', value: 'gif' },
            { label: 'BMP', value: 'bmp' },
            { label: 'TIFF', value: 'tiff' },
            { label: 'WebP', value: 'webp' },
            { label: 'SVG', value: 'svg' }
          ]
        },
        {
          name: 'extract_metadata',
          label: 'Extract Metadata',
          type: 'boolean',
          defaultValue: true,
          required: true
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['Pillow', 'exifread']
  },

  // Integration Tools
  {
    id: 'api-caller',
    type: ToolType.API_CALLER,
    name: 'API Gateway',
    description: 'Enterprise-grade HTTP client with OAuth, rate limiting, and automatic retry mechanisms',
    icon: 'Globe',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'auth_type',
          label: 'Authentication Type',
          type: 'select',
          defaultValue: 'none',
          required: true,
          options: [
            { label: 'None', value: 'none' },
            { label: 'API Key', value: 'api_key' },
            { label: 'Bearer Token', value: 'bearer' },
            { label: 'OAuth 2.0', value: 'oauth2' },
            { label: 'Basic Auth', value: 'basic' }
          ]
        },
        {
          name: 'timeout',
          label: 'Request Timeout (seconds)',
          type: 'select',
          defaultValue: '30',
          required: true,
          options: [
            { label: '5 seconds', value: '5' },
            { label: '15 seconds', value: '15' },
            { label: '30 seconds', value: '30' },
            { label: '60 seconds', value: '60' },
            { label: '120 seconds', value: '120' }
          ]
        },
        {
          name: 'retry_attempts',
          label: 'Retry Attempts',
          type: 'select',
          defaultValue: '3',
          required: true,
          options: [
            { label: 'No retries', value: '0' },
            { label: '1 retry', value: '1' },
            { label: '3 retries', value: '3' },
            { label: '5 retries', value: '5' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['httpx', 'requests']
  },
  {
    id: 'web-scraper',
    type: ToolType.WEB_SCRAPER,
    name: 'Web Scraper Elite',
    description: 'Intelligent web scraping with JavaScript rendering and anti-detection capabilities',
    icon: 'Zap',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'rendering_engine',
          label: 'Rendering Engine',
          type: 'select',
          defaultValue: 'requests',
          required: true,
          options: [
            { label: 'Requests (Fast)', value: 'requests' },
            { label: 'Selenium (JavaScript)', value: 'selenium' },
            { label: 'Playwright (Advanced)', value: 'playwright' }
          ]
        },
        {
          name: 'user_agent',
          label: 'User Agent',
          type: 'select',
          defaultValue: 'chrome',
          required: true,
          options: [
            { label: 'Chrome (Latest)', value: 'chrome' },
            { label: 'Firefox (Latest)', value: 'firefox' },
            { label: 'Safari (Latest)', value: 'safari' },
            { label: 'Custom', value: 'custom' }
          ]
        },
        {
          name: 'delay_between_requests',
          label: 'Delay Between Requests (seconds)',
          type: 'select',
          defaultValue: '1',
          required: true,
          options: [
            { label: 'No delay', value: '0' },
            { label: '0.5 seconds', value: '0.5' },
            { label: '1 second', value: '1' },
            { label: '2 seconds', value: '2' },
            { label: '5 seconds', value: '5' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['beautifulsoup4', 'requests', 'selenium', 'lxml']
  },
  {
    id: 'database',
    type: ToolType.DATABASE,
    name: 'Database Connect',
    description: 'Universal database connector supporting SQL, NoSQL, and cloud data warehouses',
    icon: 'Database',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'database_type',
          label: 'Database Type',
          type: 'select',
          defaultValue: 'postgresql',
          required: true,
          options: [
            { label: 'PostgreSQL', value: 'postgresql' },
            { label: 'MySQL', value: 'mysql' },
            { label: 'SQLite', value: 'sqlite' },
            { label: 'MongoDB', value: 'mongodb' },
            { label: 'Redis', value: 'redis' },
            { label: 'BigQuery', value: 'bigquery' },
            { label: 'Snowflake', value: 'snowflake' }
          ]
        },
        {
          name: 'connection_pooling',
          label: 'Connection Pooling',
          type: 'select',
          defaultValue: 'enabled',
          required: true,
          options: [
            { label: 'Enabled', value: 'enabled' },
            { label: 'Disabled', value: 'disabled' }
          ]
        },
        {
          name: 'max_connections',
          label: 'Maximum Connections',
          type: 'select',
          defaultValue: '10',
          required: true,
          options: [
            { label: '5 connections', value: '5' },
            { label: '10 connections', value: '10' },
            { label: '20 connections', value: '20' },
            { label: '50 connections', value: '50' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['sqlalchemy', 'asyncpg', 'pymongo', 'mysql-connector-python']
  },
  {
    id: 'email-sender',
    type: ToolType.EMAIL_SENDER,
    name: 'Email Studio',
    description: 'Professional email automation with templates, tracking, and delivery analytics',
    icon: 'Mail',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'email_provider',
          label: 'Email Provider',
          type: 'select',
          defaultValue: 'smtp',
          required: true,
          options: [
            { label: 'SMTP', value: 'smtp' },
            { label: 'SendGrid', value: 'sendgrid' },
            { label: 'Mailgun', value: 'mailgun' },
            { label: 'Amazon SES', value: 'ses' },
            { label: 'Gmail API', value: 'gmail' }
          ]
        },
        {
          name: 'email_format',
          label: 'Email Format',
          type: 'select',
          defaultValue: 'html',
          required: true,
          options: [
            { label: 'HTML', value: 'html' },
            { label: 'Plain Text', value: 'text' },
            { label: 'Both', value: 'both' }
          ]
        },
        {
          name: 'tracking_enabled',
          label: 'Enable Tracking',
          type: 'boolean',
          defaultValue: true,
          required: true
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['smtplib', 'email-validator']
  },

  // Computing Tools
  {
    id: 'calculator',
    type: ToolType.CALCULATOR,
    name: 'Math Engine',
    description: 'Scientific computing powerhouse with statistical analysis and symbolic mathematics',
    icon: 'Calculator',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'precision',
          label: 'Calculation Precision',
          type: 'select',
          defaultValue: 'high',
          required: true,
          options: [
            { label: 'Standard (64-bit)', value: 'standard' },
            { label: 'High (128-bit)', value: 'high' },
            { label: 'Ultra (256-bit)', value: 'ultra' }
          ]
        },
        {
          name: 'math_modules',
          label: 'Math Modules',
          type: 'multiselect',
          defaultValue: ['numpy', 'scipy'],
          required: true,
          options: [
            { label: 'NumPy (Arrays)', value: 'numpy' },
            { label: 'SciPy (Scientific)', value: 'scipy' },
            { label: 'SymPy (Symbolic)', value: 'sympy' },
            { label: 'Pandas (Data)', value: 'pandas' },
            { label: 'Statsmodels (Statistics)', value: 'statsmodels' }
          ]
        },
        {
          name: 'output_format',
          label: 'Output Format',
          type: 'select',
          defaultValue: 'decimal',
          required: true,
          options: [
            { label: 'Decimal', value: 'decimal' },
            { label: 'Fraction', value: 'fraction' },
            { label: 'Scientific Notation', value: 'scientific' },
            { label: 'LaTeX', value: 'latex' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['numpy', 'scipy', 'sympy']
  },
  {
    id: 'data-analyzer',
    type: ToolType.CALCULATOR,
    name: 'Data Analyzer Pro',
    description: 'Advanced data analysis with statistical modeling, visualization, and machine learning',
    icon: 'BarChart3',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'analysis_types',
          label: 'Analysis Types',
          type: 'multiselect',
          defaultValue: ['descriptive', 'correlation'],
          required: true,
          options: [
            { label: 'Descriptive Statistics', value: 'descriptive' },
            { label: 'Correlation Analysis', value: 'correlation' },
            { label: 'Regression Analysis', value: 'regression' },
            { label: 'Time Series', value: 'timeseries' },
            { label: 'Clustering', value: 'clustering' },
            { label: 'Classification', value: 'classification' }
          ]
        },
        {
          name: 'visualization',
          label: 'Generate Visualizations',
          type: 'boolean',
          defaultValue: true,
          required: true
        },
        {
          name: 'output_format',
          label: 'Report Format',
          type: 'select',
          defaultValue: 'json',
          required: true,
          options: [
            { label: 'JSON', value: 'json' },
            { label: 'HTML Report', value: 'html' },
            { label: 'PDF Report', value: 'pdf' },
            { label: 'Excel Report', value: 'excel' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn']
  },
  {
    id: 'image-processor',
    type: ToolType.IMAGE_PROCESSOR,
    name: 'Vision AI',
    description: 'Advanced image processing with OCR, object detection, and AI-powered analysis',
    icon: 'Image',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'processing_features',
          label: 'Processing Features',
          type: 'multiselect',
          defaultValue: ['resize', 'ocr'],
          required: true,
          options: [
            { label: 'Resize & Crop', value: 'resize' },
            { label: 'OCR (Text Recognition)', value: 'ocr' },
            { label: 'Object Detection', value: 'detection' },
            { label: 'Face Recognition', value: 'faces' },
            { label: 'Color Analysis', value: 'colors' },
            { label: 'Edge Detection', value: 'edges' },
            { label: 'Filters & Effects', value: 'filters' }
          ]
        },
        {
          name: 'ai_model',
          label: 'AI Model',
          type: 'select',
          defaultValue: 'yolo',
          required: true,
          options: [
            { label: 'YOLO v8 (Fast)', value: 'yolo' },
            { label: 'ResNet (Accurate)', value: 'resnet' },
            { label: 'EfficientNet (Balanced)', value: 'efficientnet' }
          ]
        },
        {
          name: 'output_quality',
          label: 'Output Quality',
          type: 'select',
          defaultValue: 'high',
          required: true,
          options: [
            { label: 'Fast (Low Quality)', value: 'fast' },
            { label: 'Balanced', value: 'balanced' },
            { label: 'High Quality', value: 'high' },
            { label: 'Maximum Quality', value: 'maximum' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['Pillow', 'opencv-python', 'pytesseract', 'ultralytics']
  },
  {
    id: 'text-analyzer',
    type: ToolType.TEXT_ANALYZER,
    name: 'NLP Engine',
    description: 'State-of-the-art natural language processing with sentiment analysis and translation',
    icon: 'Brain',
    category: 'compute',
    configSchema: {
      fields: [
        {
          name: 'nlp_features',
          label: 'NLP Features',
          type: 'multiselect',
          defaultValue: ['sentiment', 'entities'],
          required: true,
          options: [
            { label: 'Sentiment Analysis', value: 'sentiment' },
            { label: 'Named Entity Recognition', value: 'entities' },
            { label: 'Language Detection', value: 'language' },
            { label: 'Translation', value: 'translation' },
            { label: 'Text Summarization', value: 'summarization' },
            { label: 'Keyword Extraction', value: 'keywords' },
            { label: 'Topic Modeling', value: 'topics' }
          ]
        },
        {
          name: 'language_model',
          label: 'Language Model',
          type: 'select',
          defaultValue: 'spacy',
          required: true,
          options: [
            { label: 'spaCy (Fast)', value: 'spacy' },
            { label: 'Transformers (Advanced)', value: 'transformers' },
            { label: 'NLTK (Classic)', value: 'nltk' }
          ]
        },
        {
          name: 'supported_languages',
          label: 'Supported Languages',
          type: 'multiselect',
          defaultValue: ['en', 'es', 'fr'],
          required: true,
          options: [
            { label: 'English', value: 'en' },
            { label: 'Spanish', value: 'es' },
            { label: 'French', value: 'fr' },
            { label: 'German', value: 'de' },
            { label: 'Italian', value: 'it' },
            { label: 'Portuguese', value: 'pt' },
            { label: 'Chinese', value: 'zh' },
            { label: 'Japanese', value: 'ja' },
            { label: 'Korean', value: 'ko' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['spacy', 'nltk', 'transformers', 'textblob']
  },

  // Utility Tools
  {
    id: 'scheduler',
    type: ToolType.CUSTOM,
    name: 'Task Scheduler',
    description: 'Advanced task scheduling with cron expressions, intervals, and timezone support',
    icon: 'Clock',
    category: 'utility',
    configSchema: {
      fields: [
        {
          name: 'schedule_type',
          label: 'Schedule Type',
          type: 'select',
          defaultValue: 'interval',
          required: true,
          options: [
            { label: 'Interval (Every X minutes)', value: 'interval' },
            { label: 'Cron Expression', value: 'cron' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' }
          ]
        },
        {
          name: 'timezone',
          label: 'Timezone',
          type: 'select',
          defaultValue: 'utc',
          required: true,
          options: [
            { label: 'UTC', value: 'utc' },
            { label: 'US Eastern', value: 'us/eastern' },
            { label: 'US Central', value: 'us/central' },
            { label: 'US Mountain', value: 'us/mountain' },
            { label: 'US Pacific', value: 'us/pacific' },
            { label: 'Europe/London', value: 'europe/london' },
            { label: 'Asia/Tokyo', value: 'asia/tokyo' }
          ]
        },
        {
          name: 'max_concurrent',
          label: 'Max Concurrent Tasks',
          type: 'select',
          defaultValue: '5',
          required: true,
          options: [
            { label: '1 task', value: '1' },
            { label: '3 tasks', value: '3' },
            { label: '5 tasks', value: '5' },
            { label: '10 tasks', value: '10' },
            { label: 'Unlimited', value: 'unlimited' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['apscheduler', 'pytz']
  },
  {
    id: 'security-scanner',
    type: ToolType.CUSTOM,
    name: 'Security Scanner',
    description: 'Comprehensive security analysis with vulnerability detection and compliance checking',
    icon: 'Shield',
    category: 'utility',
    configSchema: {
      fields: [
        {
          name: 'scan_types',
          label: 'Scan Types',
          type: 'multiselect',
          defaultValue: ['vulnerabilities', 'secrets'],
          required: true,
          options: [
            { label: 'Vulnerability Scan', value: 'vulnerabilities' },
            { label: 'Secret Detection', value: 'secrets' },
            { label: 'Dependency Check', value: 'dependencies' },
            { label: 'Code Quality', value: 'quality' },
            { label: 'License Check', value: 'licenses' }
          ]
        },
        {
          name: 'severity_threshold',
          label: 'Severity Threshold',
          type: 'select',
          defaultValue: 'medium',
          required: true,
          options: [
            { label: 'Critical Only', value: 'critical' },
            { label: 'High and Critical', value: 'high' },
            { label: 'Medium and Above', value: 'medium' },
            { label: 'All Issues', value: 'low' }
          ]
        },
        {
          name: 'output_format',
          label: 'Report Format',
          type: 'select',
          defaultValue: 'json',
          required: true,
          options: [
            { label: 'JSON', value: 'json' },
            { label: 'SARIF', value: 'sarif' },
            { label: 'HTML Report', value: 'html' },
            { label: 'PDF Report', value: 'pdf' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['bandit', 'safety', 'detect-secrets']
  },
  {
    id: 'code-generator',
    type: ToolType.CUSTOM,
    name: 'Code Generator',
    description: 'AI-powered code generation with templates, documentation, and best practices',
    icon: 'Code',
    category: 'utility',
    configSchema: {
      fields: [
        {
          name: 'languages',
          label: 'Supported Languages',
          type: 'multiselect',
          defaultValue: ['python', 'javascript'],
          required: true,
          options: [
            { label: 'Python', value: 'python' },
            { label: 'JavaScript', value: 'javascript' },
            { label: 'TypeScript', value: 'typescript' },
            { label: 'Java', value: 'java' },
            { label: 'C#', value: 'csharp' },
            { label: 'Go', value: 'go' },
            { label: 'Rust', value: 'rust' }
          ]
        },
        {
          name: 'code_style',
          label: 'Code Style',
          type: 'select',
          defaultValue: 'pep8',
          required: true,
          options: [
            { label: 'PEP 8 (Python)', value: 'pep8' },
            { label: 'Google Style', value: 'google' },
            { label: 'Airbnb Style', value: 'airbnb' },
            { label: 'Standard', value: 'standard' }
          ]
        },
        {
          name: 'include_tests',
          label: 'Include Tests',
          type: 'boolean',
          defaultValue: true,
          required: true
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['black', 'pylint', 'mypy']
  },
  {
    id: 'monitoring',
    type: ToolType.CUSTOM,
    name: 'System Monitor',
    description: 'Real-time system monitoring with metrics collection, alerting, and dashboards',
    icon: 'Activity',
    category: 'utility',
    configSchema: {
      fields: [
        {
          name: 'monitor_metrics',
          label: 'Monitor Metrics',
          type: 'multiselect',
          defaultValue: ['cpu', 'memory', 'disk'],
          required: true,
          options: [
            { label: 'CPU Usage', value: 'cpu' },
            { label: 'Memory Usage', value: 'memory' },
            { label: 'Disk Usage', value: 'disk' },
            { label: 'Network I/O', value: 'network' },
            { label: 'Process Count', value: 'processes' },
            { label: 'Temperature', value: 'temperature' }
          ]
        },
        {
          name: 'alert_threshold',
          label: 'Alert Threshold (%)',
          type: 'select',
          defaultValue: '80',
          required: true,
          options: [
            { label: '60%', value: '60' },
            { label: '70%', value: '70' },
            { label: '80%', value: '80' },
            { label: '90%', value: '90' },
            { label: '95%', value: '95' }
          ]
        },
        {
          name: 'dashboard_enabled',
          label: 'Enable Dashboard',
          type: 'boolean',
          defaultValue: true,
          required: true
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['psutil', 'prometheus-client']
  },

  // Media Tools
  {
    id: 'audio-processor',
    type: ToolType.CUSTOM,
    name: 'Audio Processor',
    description: 'Professional audio processing with format conversion, effects, and analysis',
    icon: 'Music',
    category: 'utility',
    configSchema: {
      fields: [
        {
          name: 'audio_formats',
          label: 'Audio Formats',
          type: 'multiselect',
          defaultValue: ['mp3', 'wav', 'flac'],
          required: true,
          options: [
            { label: 'MP3', value: 'mp3' },
            { label: 'WAV', value: 'wav' },
            { label: 'FLAC', value: 'flac' },
            { label: 'AAC', value: 'aac' },
            { label: 'OGG', value: 'ogg' },
            { label: 'M4A', value: 'm4a' }
          ]
        },
        {
          name: 'audio_quality',
          label: 'Audio Quality',
          type: 'select',
          defaultValue: 'high',
          required: true,
          options: [
            { label: 'Low (64 kbps)', value: 'low' },
            { label: 'Medium (128 kbps)', value: 'medium' },
            { label: 'High (320 kbps)', value: 'high' },
            { label: 'Lossless', value: 'lossless' }
          ]
        },
        {
          name: 'effects',
          label: 'Audio Effects',
          type: 'multiselect',
          defaultValue: ['normalize'],
          required: false,
          options: [
            { label: 'Normalize', value: 'normalize' },
            { label: 'Noise Reduction', value: 'noise_reduction' },
            { label: 'Echo/Cancel', value: 'echo_cancel' },
            { label: 'Volume Boost', value: 'volume_boost' },
            { label: 'Fade In/Out', value: 'fade' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['librosa', 'pydub', 'soundfile']
  },
  {
    id: 'video-processor',
    type: ToolType.CUSTOM,
    name: 'Video Processor',
    description: 'Advanced video processing with format conversion, compression, and effects',
    icon: 'Video',
    category: 'utility',
    configSchema: {
      fields: [
        {
          name: 'video_formats',
          label: 'Video Formats',
          type: 'multiselect',
          defaultValue: ['mp4', 'avi', 'mov'],
          required: true,
          options: [
            { label: 'MP4', value: 'mp4' },
            { label: 'AVI', value: 'avi' },
            { label: 'MOV', value: 'mov' },
            { label: 'MKV', value: 'mkv' },
            { label: 'WebM', value: 'webm' },
            { label: 'FLV', value: 'flv' }
          ]
        },
        {
          name: 'resolution',
          label: 'Output Resolution',
          type: 'select',
          defaultValue: 'original',
          required: true,
          options: [
            { label: 'Original', value: 'original' },
            { label: '4K (3840x2160)', value: '4k' },
            { label: '1080p (1920x1080)', value: '1080p' },
            { label: '720p (1280x720)', value: '720p' },
            { label: '480p (854x480)', value: '480p' }
          ]
        },
        {
          name: 'compression',
          label: 'Compression Level',
          type: 'select',
          defaultValue: 'medium',
          required: true,
          options: [
            { label: 'High Quality (Large)', value: 'high' },
            { label: 'Medium (Balanced)', value: 'medium' },
            { label: 'Small (Compressed)', value: 'small' },
            { label: 'Ultra Small', value: 'ultra' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['opencv-python', 'moviepy']
  },

  // Communication Tools
  {
    id: 'chat-integration',
    type: ToolType.CUSTOM,
    name: 'Chat Integration',
    description: 'Multi-platform chat integration with Slack, Discord, Teams, and webhooks',
    icon: 'MessageSquare',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'platforms',
          label: 'Chat Platforms',
          type: 'multiselect',
          defaultValue: ['slack', 'discord'],
          required: true,
          options: [
            { label: 'Slack', value: 'slack' },
            { label: 'Discord', value: 'discord' },
            { label: 'Microsoft Teams', value: 'teams' },
            { label: 'Webhooks', value: 'webhooks' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'WhatsApp', value: 'whatsapp' }
          ]
        },
        {
          name: 'message_format',
          label: 'Message Format',
          type: 'select',
          defaultValue: 'markdown',
          required: true,
          options: [
            { label: 'Plain Text', value: 'text' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML', value: 'html' },
            { label: 'Rich Format', value: 'rich' }
          ]
        },
        {
          name: 'rate_limiting',
          label: 'Rate Limiting',
          type: 'select',
          defaultValue: 'standard',
          required: true,
          options: [
            { label: 'None', value: 'none' },
            { label: 'Standard', value: 'standard' },
            { label: 'Conservative', value: 'conservative' },
            { label: 'Aggressive', value: 'aggressive' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['slack-sdk', 'discord.py', 'requests']
  },

  // Business Tools
  {
    id: 'calendar-integration',
    type: ToolType.CUSTOM,
    name: 'Calendar Sync',
    description: 'Universal calendar integration with Google, Outlook, and iCal support',
    icon: 'Calendar',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'calendar_providers',
          label: 'Calendar Providers',
          type: 'multiselect',
          defaultValue: ['google', 'outlook'],
          required: true,
          options: [
            { label: 'Google Calendar', value: 'google' },
            { label: 'Outlook', value: 'outlook' },
            { label: 'iCal', value: 'ical' },
            { label: 'CalDAV', value: 'caldav' },
            { label: 'Exchange', value: 'exchange' }
          ]
        },
        {
          name: 'sync_direction',
          label: 'Sync Direction',
          type: 'select',
          defaultValue: 'bidirectional',
          required: true,
          options: [
            { label: 'Bidirectional', value: 'bidirectional' },
            { label: 'Read Only', value: 'read' },
            { label: 'Write Only', value: 'write' }
          ]
        },
        {
          name: 'event_types',
          label: 'Event Types',
          type: 'multiselect',
          defaultValue: ['meetings', 'reminders'],
          required: true,
          options: [
            { label: 'Meetings', value: 'meetings' },
            { label: 'Reminders', value: 'reminders' },
            { label: 'Tasks', value: 'tasks' },
            { label: 'Deadlines', value: 'deadlines' },
            { label: 'All Events', value: 'all' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['google-api-python-client', 'exchangelib']
  },
  {
    id: 'payment-processor',
    type: ToolType.CUSTOM,
    name: 'Payment Gateway',
    description: 'Secure payment processing with Stripe, PayPal, and cryptocurrency support',
    icon: 'CreditCard',
    category: 'integration',
    configSchema: {
      fields: [
        {
          name: 'payment_providers',
          label: 'Payment Providers',
          type: 'multiselect',
          defaultValue: ['stripe', 'paypal'],
          required: true,
          options: [
            { label: 'Stripe', value: 'stripe' },
            { label: 'PayPal', value: 'paypal' },
            { label: 'Square', value: 'square' },
            { label: 'Bitcoin', value: 'bitcoin' },
            { label: 'Ethereum', value: 'ethereum' }
          ]
        },
        {
          name: 'currency',
          label: 'Default Currency',
          type: 'select',
          defaultValue: 'usd',
          required: true,
          options: [
            { label: 'USD', value: 'usd' },
            { label: 'EUR', value: 'eur' },
            { label: 'GBP', value: 'gbp' },
            { label: 'JPY', value: 'jpy' },
            { label: 'CAD', value: 'cad' },
            { label: 'AUD', value: 'aud' }
          ]
        },
        {
          name: 'security_level',
          label: 'Security Level',
          type: 'select',
          defaultValue: 'pci',
          required: true,
          options: [
            { label: 'PCI DSS Compliant', value: 'pci' },
            { label: 'Enhanced Security', value: 'enhanced' },
            { label: 'Maximum Security', value: 'maximum' }
          ]
        }
      ]
    },
    codeTemplate: '',
    requiredDependencies: ['stripe', 'paypalrestsdk']
  }
];

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  FileText, Globe, Calculator, Database,
  Mail, Image, Brain, Zap, Clock,
  BarChart3, Shield, Code, Palette,
  Music, Video, MapPin, Cloud,
  Lock, Users, Wifi, Camera,
  FileSpreadsheet, FileImage, FileVideo,
  MessageSquare, Calendar, CreditCard,
  ShoppingCart, Truck, Package,
  Activity
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
