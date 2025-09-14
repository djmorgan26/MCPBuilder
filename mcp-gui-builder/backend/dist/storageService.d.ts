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
export declare class StorageService {
    private dataDir;
    private projectsFile;
    constructor();
    init(): Promise<void>;
    saveProject(serverConfig: ServerConfig, tools: Tool[], resources: Resource[], projectId?: string): Promise<string>;
    loadProject(projectId: string): Promise<SavedProject | null>;
    loadProjects(): Promise<SavedProject[]>;
    deleteProject(projectId: string): Promise<boolean>;
    getRecentProjects(limit?: number): Promise<SavedProject[]>;
    searchProjects(query: string): Promise<SavedProject[]>;
    private saveProjects;
    private generateId;
    autoSave(serverConfig: ServerConfig, tools: Tool[], resources: Resource[]): Promise<string>;
    loadAutoSave(): Promise<SavedProject | null>;
}
export default StorageService;
//# sourceMappingURL=storageService.d.ts.map