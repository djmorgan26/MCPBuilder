import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ServerConfig, Tool, Resource } from './types';

export interface SavedProject {
  id: string;
  name: string;
  serverConfig: ServerConfig;
  tools: Tool[];
  resources: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

export class StorageService {
  private dataDir: string;
  private projectsFile: string;

  constructor() {
    this.dataDir = path.join(os.homedir(), '.mcp-gui-builder');
    this.projectsFile = path.join(this.dataDir, 'projects.json');
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // Create projects file if it doesn't exist
      try {
        await fs.access(this.projectsFile);
      } catch {
        await fs.writeFile(this.projectsFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  async saveProject(serverConfig: ServerConfig, tools: Tool[], resources: Resource[], projectId?: string): Promise<string> {
    const projects = await this.loadProjects();

    const id = projectId || this.generateId();
    const now = new Date();

    const existingIndex = projects.findIndex(p => p.id === id);
    const project: SavedProject = {
      id,
      name: serverConfig.name,
      serverConfig,
      tools,
      resources,
      createdAt: existingIndex >= 0 ? projects[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    await this.saveProjects(projects);
    return id;
  }

  async loadProject(projectId: string): Promise<SavedProject | null> {
    const projects = await this.loadProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  async loadProjects(): Promise<SavedProject[]> {
    try {
      const data = await fs.readFile(this.projectsFile, 'utf-8');
      const projects = JSON.parse(data);

      // Convert date strings back to Date objects
      return projects.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const projects = await this.loadProjects();
    const initialLength = projects.length;
    const filteredProjects = projects.filter(p => p.id !== projectId);

    if (filteredProjects.length < initialLength) {
      await this.saveProjects(filteredProjects);
      return true;
    }
    return false;
  }

  async getRecentProjects(limit: number = 10): Promise<SavedProject[]> {
    const projects = await this.loadProjects();
    return projects
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async searchProjects(query: string): Promise<SavedProject[]> {
    const projects = await this.loadProjects();
    const lowerQuery = query.toLowerCase();

    return projects.filter(project =>
      project.name.toLowerCase().includes(lowerQuery) ||
      project.serverConfig.description.toLowerCase().includes(lowerQuery) ||
      project.tools.some(tool =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery)
      )
    );
  }

  private async saveProjects(projects: SavedProject[]): Promise<void> {
    await fs.writeFile(this.projectsFile, JSON.stringify(projects, null, 2));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Auto-save functionality for the current session
  async autoSave(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]): Promise<string> {
    const AUTO_SAVE_ID = 'auto-save-current';
    return this.saveProject(serverConfig, tools, resources, AUTO_SAVE_ID);
  }

  async loadAutoSave(): Promise<SavedProject | null> {
    return this.loadProject('auto-save-current');
  }
}

export default StorageService;