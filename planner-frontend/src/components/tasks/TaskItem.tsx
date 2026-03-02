import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, ListTodo, Pencil, Star, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useCompleteTask, useDeleteTask } from "../../hooks/useTasks";
import type { Task } from "../../types";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  isDragging?: boolean;
}

export default function TaskItem({
  task,
  onEdit,
  onView,
  isDragging,
}: TaskItemProps) {
  const [showActions, setShowActions] = useState(false);
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "1":
        return "border-l-red-500 bg-red-50";
      case "2":
        return "border-l-orange-500 bg-orange-50";
      case "3":
        return "border-l-yellow-500 bg-yellow-50";
      case "4":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `${format(date, "MMM d")} (Overdue)`;
    return format(date, "MMM d");
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status !== "completed") {
      completeTaskMutation.mutate(task.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
        getPriorityColor(task.priority),
        task.status === "completed" && "opacity-75",
        (isDragging || isSortableDragging) && "shadow-lg z-10",
        task.isImportant && "ring-2 ring-yellow-400",
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onView(task)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 h-full w-1 cursor-grab hover:bg-gray-300 transition-colors"
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Checkbox */}
            <button
              onClick={handleComplete}
              className={clsx(
                "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                task.status === "completed"
                  ? "bg-green-500 border-green-500 text-white"
                  : "border-gray-300 hover:border-green-500",
              )}
            >
              {task.status === "completed" && "✓"}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3
                  className={clsx(
                    "text-sm font-medium truncate",
                    task.status === "completed"
                      ? "line-through text-gray-500"
                      : "text-gray-900",
                  )}
                >
                  {task.title}
                </h3>
                {task.isImportant && (
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                )}
              </div>

              {task.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                {task.project && (
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: task.project.color + "20",
                      color: task.project.color,
                    }}
                  >
                    {task.project.name}
                  </span>
                )}

                {task.dueDate && (
                  <span
                    className={clsx(
                      "font-medium flex items-center gap-1",
                      isPast(new Date(task.dueDate)) &&
                        task.status !== "completed"
                        ? "text-red-600"
                        : "text-gray-600",
                    )}
                  >
                    <Calendar size={12} /> {formatDueDate(task.dueDate)}
                  </span>
                )}

                {task.dueTime && !task.allDay && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {task.dueTime}
                  </span>
                )}

                <span className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ")}
                </span>

                {task.progress > 0 && task.status !== "completed" && (
                  <span className="text-blue-600">{task.progress}%</span>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="flex items-center gap-1">
                    <ListTodo size={12} />{" "}
                    {
                      task.subtasks.filter((st) => st.status === "completed")
                        .length
                    }
                    /{task.subtasks.length}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {task.progress > 0 && task.status !== "completed" && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tag.color + "20",
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit task"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
