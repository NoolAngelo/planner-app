import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tasksApi } from "../services/api";
import type { Task } from "../types";

export function useTasks(params?: {
  projectId?: string;
  status?: string;
  priority?: string;
  search?: string;
  dueDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.getTasks(params),
    select: (data) => data.data,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.getTask(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      tasksApi.updateTask(id, data),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      toast.success("Task updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete task");
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task completed!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to complete task");
    },
  });
}

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskIds: string[]; updates: Partial<Task> }) =>
      tasksApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tasks updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update tasks");
    },
  });
}
