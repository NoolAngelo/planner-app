import { format, isPast, isToday } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Star,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types";

export default function DashboardPage() {
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const tasks = tasksData?.tasks || [];

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed",
    ).length;

    // Today's tasks
    const today = tasks.filter(
      (t) => t.dueDate && isToday(new Date(t.dueDate)),
    );

    // Important tasks
    const important = tasks.filter(
      (t) => t.isImportant && t.status !== "completed",
    );

    // Priority breakdown
    const priorityBreakdown = {
      highest: tasks.filter(
        (t) => t.priority === "1" && t.status !== "completed",
      ).length,
      high: tasks.filter((t) => t.priority === "2" && t.status !== "completed")
        .length,
      medium: tasks.filter(
        (t) => t.priority === "3" && t.status !== "completed",
      ).length,
      low: tasks.filter((t) => t.priority === "4" && t.status !== "completed")
        .length,
    };

    // Project stats
    const projectStats = projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      return {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === "completed")
          .length,
        progress:
          projectTasks.length > 0
            ? Math.round(
                (projectTasks.filter((t) => t.status === "completed").length /
                  projectTasks.length) *
                  100,
              )
            : 0,
      };
    });

    return {
      total,
      completed,
      inProgress,
      overdue,
      today,
      important,
      priorityBreakdown,
      projectStats,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, projects]);

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your tasks.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Total Tasks</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.total}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.completionRate}% completion rate
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.completed}
              </p>
              <p className="text-sm text-gray-500 mt-1">Well done</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.inProgress}
              </p>
              <p className="text-sm text-gray-500 mt-1">In progress</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Overdue</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.overdue}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.overdue > 0 ? "Needs attention" : "All caught up"}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Task Priorities
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-red-600">
                {stats.priorityBreakdown.highest}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Highest</p>
            <p className="text-xs text-gray-500">Priority</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-orange-600">
                {stats.priorityBreakdown.high}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">High</p>
            <p className="text-xs text-gray-500">Priority</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-yellow-600">
                {stats.priorityBreakdown.medium}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Medium</p>
            <p className="text-xs text-gray-500">Priority</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold text-green-600">
                {stats.priorityBreakdown.low}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">Low</p>
            <p className="text-xs text-gray-500">Priority</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Today's Tasks</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {stats.today.length} tasks
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.today.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No tasks due today. All clear.
              </p>
            ) : (
              stats.today.slice(0, 5).map((task: Task) => (
                <div
                  key={task.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-500">
                    {task.dueTime ? `Due at ${task.dueTime}` : "All day"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Important Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Important Tasks
            </h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {stats.important.length} tasks
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.important.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No important tasks pending.
              </p>
            ) : (
              stats.important.slice(0, 5).map((task: Task) => (
                <div
                  key={task.id}
                  className="border-l-4 border-yellow-500 pl-4 py-2"
                >
                  <h4 className="font-medium text-gray-900 flex items-center gap-1">
                    <Star
                      size={14}
                      className="text-yellow-500 fill-yellow-500"
                    />{" "}
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {task.dueDate
                      ? `Due ${format(new Date(task.dueDate), "MMM d")}`
                      : "No due date"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      {stats.projectStats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Projects Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.projectStats.slice(0, 6).map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 truncate">
                    {project.name}
                  </h4>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {project.completedTasks} of {project.totalTasks} tasks
                    completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
