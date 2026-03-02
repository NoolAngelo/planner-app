import clsx from "clsx";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ProjectForm from "../components/projects/ProjectForm";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useDeleteProject, useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import type { Project } from "../types";
import { ProjectIcon } from "../utils/projectIcons";

interface ProjectCardProps {
  project: Project & {
    taskCount?: number;
    completedTasks?: number;
    progress?: number;
  };
  onEdit: (project: Project) => void;
  level?: number;
}

function ProjectCard({ project, onEdit, level = 0 }: ProjectCardProps) {
  const [showActions, setShowActions] = useState(false);
  const deleteProjectMutation = useDeleteProject();

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${project.name}"? This will also delete all tasks in this project.`,
      )
    ) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 group",
        level > 0 && "ml-6 border-l-4",
      )}
      style={{ borderLeftColor: level > 0 ? project.color : undefined }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Project Icon & Color */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0"
              style={{ backgroundColor: project.color }}
            >
              <ProjectIcon name={project.icon || "folder"} size={20} />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                {project.isArchived && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    Archived
                  </span>
                )}
              </div>

              {project.description && (
                <p className="text-gray-600 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Project Stats */}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center">
                  {project.taskCount || 0} tasks
                </span>
                {(project.completedTasks || 0) > 0 && (
                  <span className="flex items-center">
                    {project.completedTasks} completed
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {project.defaultView}
                </span>
              </div>

              {/* Progress Bar */}
              {(project.taskCount || 0) > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${project.progress || 0}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md"
                title="Edit project"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md"
                title="Delete project"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const { data: projects = [], isLoading } = useProjects(showArchived);
  const { data: allTasks } = useTasks();

  const tasks = allTasks?.tasks || [];

  // Calculate project stats
  const projectsWithStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter(
        (task) => task.projectId === project.id,
      );
      const completedTasks = projectTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        projectTasks.length > 0
          ? Math.round((completedTasks / projectTasks.length) * 100)
          : 0;

      return {
        ...project,
        taskCount: projectTasks.length,
        completedTasks,
        progress,
      };
    });
  }, [projects, tasks]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projectsWithStats;

    return projectsWithStats.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [projectsWithStats, searchQuery]);

  const projectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => !p.isArchived).length;
    const archived = projects.filter((p) => p.isArchived).length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;

    return {
      total,
      active,
      archived,
      totalTasks,
      completedTasks,
      averageProgress:
        total > 0
          ? Math.round(
              projectsWithStats.reduce((acc, p) => acc + (p.progress || 0), 0) /
                total,
            )
          : 0,
    };
  }, [projects, tasks, projectsWithStats]);

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setShowProjectForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleCloseForm = () => {
    setShowProjectForm(false);
    setEditingProject(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            {projectStats.active} active projects • {projectStats.totalTasks}{" "}
            total tasks • {projectStats.averageProgress}% avg progress
          </p>
        </div>
        <button
          onClick={handleCreateProject}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>New Project</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Projects</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {projectStats.total}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {projectStats.active}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {projectStats.totalTasks}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">
            Average Progress
          </h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {projectStats.averageProgress}%
          </p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showArchived"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="showArchived" className="text-sm text-gray-700">
                Show archived
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? "No projects match your search."
                : "No projects yet. Create your first project to organize your tasks!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm project={editingProject} onClose={handleCloseForm} />
      )}
    </div>
  );
}
