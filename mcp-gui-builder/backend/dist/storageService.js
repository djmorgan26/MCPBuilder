"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class StorageService {
    constructor() {
        this.dataDir = path_1.default.join(os_1.default.homedir(), '.mcp-gui-builder');
        this.projectsFile = path_1.default.join(this.dataDir, 'projects.json');
    }
    async init() {
        try {
            await fs_1.promises.mkdir(this.dataDir, { recursive: true });
            try {
                await fs_1.promises.access(this.projectsFile);
            }
            catch {
                await fs_1.promises.writeFile(this.projectsFile, JSON.stringify([], null, 2));
            }
        }
        catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }
    async saveProject(serverConfig, tools, resources, projectId) {
        const projects = await this.loadProjects();
        const id = projectId || this.generateId();
        const now = new Date();
        const existingIndex = projects.findIndex(p => p.id === id);
        const project = {
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
        }
        else {
            projects.push(project);
        }
        await this.saveProjects(projects);
        return id;
    }
    async loadProject(projectId) {
        const projects = await this.loadProjects();
        return projects.find(p => p.id === projectId) || null;
    }
    async loadProjects() {
        try {
            const data = await fs_1.promises.readFile(this.projectsFile, 'utf-8');
            const projects = JSON.parse(data);
            return projects.map((p) => ({
                ...p,
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt)
            }));
        }
        catch (error) {
            console.error('Failed to load projects:', error);
            return [];
        }
    }
    async deleteProject(projectId) {
        const projects = await this.loadProjects();
        const initialLength = projects.length;
        const filteredProjects = projects.filter(p => p.id !== projectId);
        if (filteredProjects.length < initialLength) {
            await this.saveProjects(filteredProjects);
            return true;
        }
        return false;
    }
    async getRecentProjects(limit = 10) {
        const projects = await this.loadProjects();
        return projects
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, limit);
    }
    async searchProjects(query) {
        const projects = await this.loadProjects();
        const lowerQuery = query.toLowerCase();
        return projects.filter(project => project.name.toLowerCase().includes(lowerQuery) ||
            project.serverConfig.description.toLowerCase().includes(lowerQuery) ||
            project.tools.some(tool => tool.name.toLowerCase().includes(lowerQuery) ||
                tool.description.toLowerCase().includes(lowerQuery)));
    }
    async saveProjects(projects) {
        await fs_1.promises.writeFile(this.projectsFile, JSON.stringify(projects, null, 2));
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    async autoSave(serverConfig, tools, resources) {
        const AUTO_SAVE_ID = 'auto-save-current';
        return this.saveProject(serverConfig, tools, resources, AUTO_SAVE_ID);
    }
    async loadAutoSave() {
        return this.loadProject('auto-save-current');
    }
}
exports.StorageService = StorageService;
exports.default = StorageService;
//# sourceMappingURL=storageService.js.map