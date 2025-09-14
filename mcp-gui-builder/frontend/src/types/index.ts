// Core type definitions
export interface ServerConfig {
  name: string;
  description: string;
  author: string;
  version: string;
  dependencies: string[];
  environment: Record<string, EnvironmentVariable>;
  pythonVersion: '3.9' | '3.10' | '3.11' | '3.12';
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
  required: boolean;
  secret: boolean;
}

export enum ToolType {
  FILE_READER = 'file_reader',
  API_CALLER = 'api_caller',
  CALCULATOR = 'calculator',
  DATABASE = 'database',
  WEB_SCRAPER = 'web_scraper',
  EMAIL_SENDER = 'email_sender',
  IMAGE_PROCESSOR = 'image_processor',
  TEXT_ANALYZER = 'text_analyzer',
  CUSTOM = 'custom'
}

export interface ToolTemplate {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  icon: string;
  category: 'io' | 'compute' | 'integration' | 'utility';
  configSchema: ConfigSchema;
  codeTemplate: string;
  requiredDependencies: string[];
}

export interface ConfigSchema {
  fields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'code';
  defaultValue?: any;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: ValidationRule;
  helpText?: string;
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface Tool {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  parameters: Parameter[];
  returnType: ReturnType;
  config: Record<string, any>;
  isValid: boolean;
  errors: string[];
  order: number;
  isAsync: boolean;
  requiresAuth: boolean;
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: ValidationRule;
}

export interface ReturnType {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void';
  schema?: any;
}

export interface Resource {
  id: string;
  uri: string;
  name: string;
  description: string;
  type: 'static' | 'template' | 'dynamic';
  content: any;
  mimeType: string;
  isReadOnly: boolean;
}

export interface DeploymentConfig {
  target: 'docker' | 'local' | 'cloud';
  dockerConfig?: DockerConfig;
  cloudConfig?: CloudConfig;
}

export interface DockerConfig {
  imageName: string;
  tag: string;
  baseImage: string;
  exposePort: number;
  volumes: string[];
  envFile: boolean;
}

export interface CloudConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'vercel';
  region: string;
  instanceType?: string;
}

export interface GeneratedCode {
  mainPy: string;
  requirements: string;
  dockerfile: string;
  dockerCompose: string;
  readme: string;
  envExample: string;
  tests: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}