import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import TaskForm from "../components/tasks/TaskForm";
import TaskItem from "../components/tasks/TaskItem";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import type { Task } from "../types";

type FilterStatus = "all" | "todo" | "in_progress" | "completed";
type FilterPriority = "all" | "1" | "2" | "3" | "4";
type SortField = "dueDate" | "priority" | "title" | "createdAt";

export default function TasksPage() {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const { data: tasksData, isLoading } = useTasks({
    search: searchQuery || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    priority: filterPriority !== "all" ? filterPriority : undefined,
    projectId: filterProject !== "all" ? filterProject : undefined,
  });

  const { data: projects = [] } = useProjects();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const tasks = tasksData?.tasks || [];

  const sortedTasks = useMemo(() => {
    const filtered = [...tasks];

    return filtered.sort((a, b) => {
      switch (sortField) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

        case "priority":
          return parseInt(a.priority) - parseInt(b.priority);

        case "title":
          return a.title.localeCompare(b.title);

        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        default:
          return 0;
      }
    });
  }, [tasks, sortField]);

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      overdue: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status !== "completed",
      ).length,
    };
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setDraggedTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over || active.id === over.id) return;

    const activeIndex = sortedTasks.findIndex((t) => t.id === active.id);
    const overIndex = sortedTasks.findIndex((t) => t.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      // TODO: Implement server-side reorder via bulk update API
    }
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleViewTask = (task: Task) => {
    // For now, just edit - later can implement a view modal
    handleEditTask(task);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(undefined);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {taskStats.total} tasks • {taskStats.completed} completed •{" "}
            {taskStats.inProgress} in progress
            {taskStats.overdue > 0 && (
              <span className="text-red-600">
                {" "}
                • {taskStats.overdue} overdue
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleCreateTask}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filterPriority}
              onChange={(e) =>
                setFilterPriority(e.target.value as FilterPriority)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Priorities</option>
              <option value="1">Highest</option>
              <option value="2">High</option>
              <option value="3">Medium</option>
              <option value="4">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Projects</option>
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {searchQuery ||
              filterStatus !== "all" ||
              filterPriority !== "all" ||
              filterProject !== "all"
                ? "No tasks match your filters."
                : "No tasks yet. Create your first task to get started!"}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onView={handleViewTask}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {draggedTask ? (
                <TaskItem
                  task={draggedTask}
                  onEdit={() => {}}
                  onView={() => {}}
                  isDragging={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm task={editingTask} onClose={handleCloseForm} />
      )}
    </div>
  );
}
