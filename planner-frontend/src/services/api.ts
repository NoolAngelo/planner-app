import axios from "axios";
import type { User, Task, Project, Tag, Attachment } from "../types";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true,
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getProfile: () => api.get<User>("/auth/me"),

  updateProfile: (data: Partial<User>) => api.put("/auth/me", data),
};

// Tasks API
export const tasksApi = {
  getTasks: (params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    search?: string;
    dueDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{ tasks: Task[]; total: number; page: number; pages: number }>(
      "/tasks",
      { params }
    ),

  getTask: (id: string) => api.get<Task>(`/tasks/${id}`),

  createTask: (data: Partial<Task>) => api.post<Task>("/tasks", data),

  updateTask: (id: string, data: Partial<Task>) =>
    api.put<Task>(`/tasks/${id}`, data),

  deleteTask: (id: string) => api.delete(`/tasks/${id}`),

  completeTask: (id: string) => api.patch(`/tasks/${id}/complete`),

  bulkUpdate: (data: { taskIds: string[]; updates: Partial<Task> }) =>
    api.patch("/tasks/bulk", data),
};

// Projects API
export const projectsApi = {
  getProjects: (params?: { includeArchived?: boolean }) =>
    api.get<Project[]>("/projects", { params }),

  getProject: (id: string) => api.get<Project>(`/projects/${id}`),

  createProject: (data: Partial<Project>) =>
    api.post<Project>("/projects", data),

  updateProject: (id: string, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data),

  deleteProject: (id: string) => api.delete(`/projects/${id}`),

  getProjectTree: () => api.get<Project[]>("/projects/tree"),
};

// Tags API
export const tagsApi = {
  getTags: () => api.get<Tag[]>("/tags"),

  createTag: (data: { name: string; color: string }) =>
    api.post<Tag>("/tags", data),

  updateTag: (id: string, data: Partial<Tag>) =>
    api.put<Tag>(`/tags/${id}`, data),

  deleteTag: (id: string) => api.delete(`/tags/${id}`),
};

// Attachments API
export const attachmentsApi = {
  uploadFile: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", taskId);

    return api.post<Attachment>("/attachments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteAttachment: (id: string) => api.delete(`/attachments/${id}`),
};

export default api;
