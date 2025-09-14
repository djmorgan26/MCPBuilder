import type { ServerConfig, Tool, Resource, ValidationResult } from '../types';

export const validateServer = (
  serverConfig: ServerConfig,
  tools: Tool[],
  resources: Resource[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate server configuration
  if (!serverConfig.name.trim()) {
    errors.push('Server name is required');
  } else if (!/^[a-z0-9-]+$/.test(serverConfig.name)) {
    errors.push('Server name must contain only lowercase letters, numbers, and hyphens');
  }

  if (!serverConfig.description.trim()) {
    warnings.push('Server description is recommended for better documentation');
  }

  if (!serverConfig.author.trim()) {
    warnings.push('Author name is recommended');
  }

  if (!/^\d+\.\d+\.\d+$/.test(serverConfig.version)) {
    errors.push('Version must be in semantic versioning format (e.g., 1.0.0)');
  }

  // Validate tools
  if (tools.length === 0) {
    errors.push('At least one tool is required');
  }

  const toolNames = new Set<string>();
  tools.forEach((tool, index) => {
    if (!tool.name.trim()) {
      errors.push(`Tool ${index + 1}: Name is required`);
    } else if (toolNames.has(tool.name)) {
      errors.push(`Tool ${index + 1}: Duplicate tool name "${tool.name}"`);
    } else {
      toolNames.add(tool.name);
    }

    if (!tool.description.trim()) {
      errors.push(`Tool "${tool.name}": Description is required`);
    }

    if (tool.parameters.length === 0) {
      warnings.push(`Tool "${tool.name}": No parameters defined. Consider adding parameters for better functionality`);
    }

    const paramNames = new Set<string>();
    tool.parameters.forEach((param, paramIndex) => {
      if (!param.name.trim()) {
        errors.push(`Tool "${tool.name}", Parameter ${paramIndex + 1}: Name is required`);
      } else if (paramNames.has(param.name)) {
        errors.push(`Tool "${tool.name}", Parameter ${paramIndex + 1}: Duplicate parameter name "${param.name}"`);
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
        errors.push(`Tool "${tool.name}", Parameter "${param.name}": Must be a valid Python identifier`);
      } else {
        paramNames.add(param.name);
      }

      if (!param.description.trim()) {
        errors.push(`Tool "${tool.name}", Parameter "${param.name}": Description is required`);
      }
    });

    if (!tool.isValid) {
      errors.push(`Tool "${tool.name}": Has validation errors`);
    }
  });

  // Validate resources
  const resourceUris = new Set<string>();
  const resourceNames = new Set<string>();

  resources.forEach((resource, index) => {
    if (!resource.name.trim()) {
      errors.push(`Resource ${index + 1}: Name is required`);
    } else if (resourceNames.has(resource.name)) {
      errors.push(`Resource ${index + 1}: Duplicate resource name "${resource.name}"`);
    } else {
      resourceNames.add(resource.name);
    }

    if (!resource.uri.trim()) {
      errors.push(`Resource "${resource.name}": URI is required`);
    } else if (resourceUris.has(resource.uri)) {
      errors.push(`Resource "${resource.name}": Duplicate URI "${resource.uri}"`);
    } else if (!resource.uri.startsWith('resource://') && !resource.uri.startsWith('file://') && !resource.uri.startsWith('http://') && !resource.uri.startsWith('https://')) {
      warnings.push(`Resource "${resource.name}": URI should follow a standard scheme (resource://, file://, http://, https://)`);
    } else {
      resourceUris.add(resource.uri);
    }

    if (resource.type === 'static' && !resource.content) {
      warnings.push(`Resource "${resource.name}": Static resources should have content`);
    }
  });

  // Validate environment variables
  const envVars = Object.keys(serverConfig.environment);
  envVars.forEach(key => {
    const envVar = serverConfig.environment[key];
    if (!envVar.key.trim()) {
      errors.push(`Environment variable: Key cannot be empty`);
    } else if (!/^[A-Z_][A-Z0-9_]*$/.test(envVar.key)) {
      errors.push(`Environment variable "${envVar.key}": Must be uppercase with underscores only`);
    }

    if (envVar.required && !envVar.value && !envVar.secret) {
      warnings.push(`Environment variable "${envVar.key}": Required variables should have a default value or be marked as secret`);
    }
  });

  // Check for potential conflicts
  const allNames = [...toolNames, ...resourceNames];
  const pythonKeywords = ['and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try', 'while', 'with', 'yield'];

  allNames.forEach(name => {
    if (pythonKeywords.includes(name.toLowerCase())) {
      errors.push(`Name "${name}" conflicts with Python keyword`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateToolConfiguration = (tool: Tool): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!tool.name.trim()) {
    errors.push('Tool name is required');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tool.name)) {
    errors.push('Tool name must be a valid Python identifier');
  }

  if (!tool.description.trim()) {
    errors.push('Tool description is required');
  }

  const paramNames = new Set<string>();
  tool.parameters.forEach((param, index) => {
    if (!param.name.trim()) {
      errors.push(`Parameter ${index + 1}: Name is required`);
    } else if (paramNames.has(param.name)) {
      errors.push(`Parameter ${index + 1}: Duplicate parameter name`);
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
      errors.push(`Parameter "${param.name}": Must be a valid Python identifier`);
    } else {
      paramNames.add(param.name);
    }

    if (!param.description.trim()) {
      errors.push(`Parameter "${param.name}": Description is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateResourceConfiguration = (resource: Resource): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!resource.name.trim()) {
    errors.push('Resource name is required');
  }

  if (!resource.uri.trim()) {
    errors.push('Resource URI is required');
  } else {
    try {
      new URL(resource.uri);
    } catch {
      if (!resource.uri.startsWith('resource://')) {
        errors.push('Invalid URI format');
      }
    }
  }

  if (resource.type === 'static' && !resource.content) {
    errors.push('Static resources must have content');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^[0-9]/, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export const validatePythonIdentifier = (identifier: string): boolean => {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
};

export const suggestFixes = (errors: string[]): string[] => {
  const suggestions: string[] = [];

  errors.forEach(error => {
    if (error.includes('Server name must contain only lowercase')) {
      suggestions.push('Convert server name to lowercase and replace spaces with hyphens');
    }
    if (error.includes('Version must be in semantic versioning')) {
      suggestions.push('Use format like "1.0.0" for version number');
    }
    if (error.includes('Must be a valid Python identifier')) {
      suggestions.push('Use only letters, numbers, and underscores. Start with letter or underscore');
    }
    if (error.includes('uppercase with underscores only')) {
      suggestions.push('Environment variables should be UPPERCASE_WITH_UNDERSCORES');
    }
  });

  return Array.from(new Set(suggestions));
};