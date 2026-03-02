import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { projectsApi } from "../services/api";
import type { Project } from "../types";

export function useProjects(includeArchived = false) {
  return useQuery({
    queryKey: ["projects", { includeArchived }],
    queryFn: () => projectsApi.getProjects({ includeArchived }),
    select: (data) => data.data,
  });
}

export function useProjectTree() {
  return useQuery({
    queryKey: ["projects", "tree"],
    queryFn: () => projectsApi.getProjectTree(),
    select: (data) => data.data,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getProject(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Project>) => projectsApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create project");
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.updateProject(id, data),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      toast.success("Project updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update project");
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete project");
    },
  });
}
