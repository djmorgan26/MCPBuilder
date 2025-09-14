import type { ServerConfig, Tool, Resource, SavedProject } from '../types/index';

export class StorageService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api';
  }

  async saveProject(
    serverConfig: ServerConfig,
    tools: Tool[],
    resources: Resource[] = [],
    projectId?: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverConfig,
        tools,
        resources,
        projectId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to save project: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.projectId;
  }

  async loadProject(projectId: string): Promise<SavedProject | null> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load project: ${response.statusText}`);
    }

    const result = await response.json();

    // Convert date strings back to Date objects
    if (result.data) {
      result.data.createdAt = new Date(result.data.createdAt);
      result.data.updatedAt = new Date(result.data.updatedAt);
    }

    return result.data;
  }

  async getProjects(search?: string, limit?: number): Promise<SavedProject[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/projects?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText}`);
    }

    const result = await response.json();

    // Convert date strings back to Date objects
    return result.data.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt)
    }));
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'DELETE'
    });

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.statusText}`);
    }

    return true;
  }

  async autoSave(
    serverConfig: ServerConfig,
    tools: Tool[],
    resources: Resource[] = []
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/projects/auto-save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverConfig,
        tools,
        resources
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to auto-save: ${response.statusText}`);
    }
  }

  async loadAutoSave(): Promise<SavedProject | null> {
    const response = await fetch(`${this.baseUrl}/projects/auto-save`);

    if (!response.ok) {
      console.warn('No auto-save data available');
      return null;
    }

    const result = await response.json();

    if (!result.data) {
      return null;
    }

    // Convert date strings back to Date objects
    result.data.createdAt = new Date(result.data.createdAt);
    result.data.updatedAt = new Date(result.data.updatedAt);

    return result.data;
  }
}

export default StorageService;