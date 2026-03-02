import { useState } from "react";
import { useForm } from "react-hook-form";
import { useProjects } from "../../hooks/useProjects";
import { useCreateTask, useUpdateTask } from "../../hooks/useTasks";
import type { Project, Task } from "../../types";
import LoadingSpinner from "../ui/LoadingSpinner";

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  startDate: string;
  startTime: string;
  duration: number;
  allDay: boolean;
  priority: "1" | "2" | "3" | "4";
  status: "todo" | "in_progress" | "completed" | "cancelled";
  projectId: string;
  parentTaskId: string;
  isImportant: boolean;
  progress: number;
}

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: projects = [] } = useProjects();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate || "",
      dueTime: task?.dueTime || "",
      startDate: task?.startDate || "",
      startTime: task?.startTime || "",
      duration: task?.duration || 60,
      allDay: task?.allDay || false,
      priority: task?.priority || "3",
      status: task?.status || "todo",
      projectId: task?.projectId || "",
      parentTaskId: task?.parentTaskId || "",
      isImportant: task?.isImportant || false,
      progress: task?.progress || 0,
    },
  });

  const allDay = watch("allDay");

  const onFormSubmit = async (data: TaskFormData) => {
    setIsLoading(true);

    try {
      const taskData = {
        ...data,
        duration: data.allDay ? undefined : data.duration,
        dueTime: data.allDay ? undefined : data.dueTime || undefined,
        startTime: data.allDay ? undefined : data.startTime || undefined,
        projectId: data.projectId || undefined,
        parentTaskId: data.parentTaskId || undefined,
      };

      if (task) {
        await updateTaskMutation.mutateAsync({ id: task.id, data: taskData });
      } else {
        await createTaskMutation.mutateAsync(taskData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: "1", label: "Highest", color: "text-red-600" },
    { value: "2", label: "High", color: "text-orange-600" },
    { value: "3", label: "Medium", color: "text-yellow-600" },
    { value: "4", label: "Low", color: "text-green-600" },
  ];

  const statusOptions = [
    { value: "todo", label: "To Do", color: "text-gray-600" },
    { value: "in_progress", label: "In Progress", color: "text-blue-600" },
    { value: "completed", label: "Completed", color: "text-green-600" },
    { value: "cancelled", label: "Cancelled", color: "text-red-600" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              {...register("title", { required: "Title is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe your task..."
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              {...register("projectId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No Project</option>
              {projects.map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("allDay")}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              All day task
            </label>
          </div>

          {/* Dates and Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  {...register("startTime")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time
                </label>
                <input
                  type="time"
                  {...register("dueTime")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  {...register("duration", { min: 1, max: 1440 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                  max="1440"
                />
              </div>
            </div>
          )}

          {/* Progress and Important */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress (%)
              </label>
              <input
                type="range"
                {...register("progress")}
                min="0"
                max="100"
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">
                {watch("progress")}%
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register("isImportant")}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Mark as important
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
