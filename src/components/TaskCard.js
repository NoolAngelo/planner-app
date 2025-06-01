import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../contexts/ThemeContext";
import {
  FiCheckCircle,
  FiRefreshCw,
  FiTrash2,
  FiClock,
  FiEdit2,
} from "react-icons/fi";

const formatTime = (time, is24HourFormat) => {
  if (is24HourFormat) return time;

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const TaskCard = ({
  provided,
  snapshot,
  task,
  onDelete,
  onToggleComplete,
  onEdit,
  is24HourFormat,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`task-card priority-${task.priority} ${
        snapshot.isDragging ? "dragging" : ""
      } ${task.completed ? "completed" : ""} ${isDarkMode ? "dark-mode" : ""}`}
    >
      <div className="task-content">
        <div className="task-header">
          <div className="task-title">
            {task.title}
            {task.completed && (
              <span className="completed-badge">
                <FiCheckCircle />
              </span>
            )}
          </div>
          <div className="task-actions">
            <button
              className="complete-button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task.id, task.day);
              }}
              title={task.completed ? "Mark as incomplete" : "Mark as complete"}
            >
              {task.completed ? (
                <FiRefreshCw size={14} />
              ) : (
                <FiCheckCircle size={14} />
              )}
            </button>
            <button
              className="edit-button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task, task.day);
              }}
              title="Edit task"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id, task.day);
              }}
              title="Delete task"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
        <div className="task-time">
          <FiClock size={12} style={{ marginRight: "4px" }} />
          {formatTime(task.time, is24HourFormat)}
        </div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
      </div>
    </div>
  );
};

TaskCard.propTypes = {
  provided: PropTypes.object.isRequired,
  snapshot: PropTypes.object.isRequired,
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    time: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    day: PropTypes.string.isRequired,
    completed: PropTypes.bool,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  is24HourFormat: PropTypes.bool.isRequired,
};

export default TaskCard;
