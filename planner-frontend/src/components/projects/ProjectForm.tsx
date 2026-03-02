import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCreateProject,
  useProjects,
  useUpdateProject,
} from "../../hooks/useProjects";
import type { Project } from "../../types";
import { PROJECT_ICONS, ProjectIcon } from "../../utils/projectIcons";
import LoadingSpinner from "../ui/LoadingSpinner";

interface ProjectFormProps {
  project?: Project;
  onClose: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  parentId: string;
  defaultView: "list" | "board" | "calendar" | "timeline";
}

const colorOptions = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#a855f7",
  "#d946ef",
  "#64748b",
];

const iconOptions = PROJECT_ICONS.map((opt) => opt.name);

export default function ProjectForm({ project, onClose }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: projects = [] } = useProjects();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      color: project?.color || "#6366f1",
      icon: project?.icon || "folder",
      parentId: project?.parentId || "",
      defaultView: project?.defaultView || "list",
    },
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  const onFormSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);

    try {
      const projectData = {
        ...data,
        parentId: data.parentId || undefined,
      };

      if (project) {
        await updateProjectMutation.mutateAsync({
          id: project.id,
          data: projectData,
        });
      } else {
        await createProjectMutation.mutateAsync(projectData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out current project and its descendants from parent options
  const availableParents = projects.filter((p) => {
    if (!project) return true;
    return p.id !== project.id; // For now, simple filter
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {project ? "Edit Project" : "Create New Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              {...register("name", { required: "Project name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
              placeholder="Describe your project..."
            />
          </div>

          {/* Parent Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Project
            </label>
            <select
              {...register("parentId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No Parent (Root Project)</option>
              {availableParents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Default View */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default View
            </label>
            <select
              {...register("defaultView")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="list">List View</option>
              <option value="board">Board View</option>
              <option value="calendar">Calendar View</option>
              <option value="timeline">Timeline View</option>
            </select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color
                      ? "border-gray-400 scale-110"
                      : "border-gray-200 hover:border-gray-300"
                  } transition-all duration-200`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue("icon", icon)}
                  className={`w-8 h-8 rounded-md border-2 flex items-center justify-center ${
                    selectedIcon === icon
                      ? "border-primary-500 bg-primary-50 scale-110"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } transition-all duration-200`}
                >
                  <ProjectIcon name={icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-white text-lg"
                style={{ backgroundColor: selectedColor }}
              >
                <ProjectIcon
                  name={selectedIcon}
                  size={18}
                  className="text-white"
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {watch("name") || "Project Name"}
                </h4>
                {watch("description") && (
                  <p className="text-sm text-gray-500 mt-1">
                    {watch("description")}
                  </p>
                )}
              </div>
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
              {project ? "Update Project" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
