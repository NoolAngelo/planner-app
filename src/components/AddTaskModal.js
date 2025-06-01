import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTimeFormat } from "../contexts/TimeFormatContext";
import { useTheme } from "../contexts/ThemeContext";

const formatTime = (time, is24HourFormat) => {
  if (is24HourFormat) return time;

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const AddTaskModal = ({
  onClose,
  onSubmit,
  selectedDay,
  days,
  editingTask, // New prop for editing
}) => {
  const { timeFormat } = useTimeFormat();
  const is24HourFormat = timeFormat === "24h";
  const { isDarkMode } = useTheme();

  // If editing, pre-fill fields
  const [title, setTitle] = useState(editingTask ? editingTask.title : "");
  const [description, setDescription] = useState(
    editingTask ? editingTask.description : ""
  );
  const [day, setDay] = useState(
    editingTask ? editingTask.day : selectedDay || days[0]
  );
  const [time, setTime] = useState(editingTask ? editingTask.time : "09:00");
  const [priority, setPriority] = useState(
    editingTask ? editingTask.priority : "medium"
  );
  const [repeat, setRepeat] = useState(
    editingTask ? editingTask.repeat || "none" : "none"
  );

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || "");
      setDescription(editingTask.description || "");
      setDay(editingTask.day || days[0]);
      setTime(editingTask.time || "09:00");
      setPriority(editingTask.priority || "medium");
      setRepeat(editingTask.repeat || "none");
    }
  }, [editingTask, days]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      ...(editingTask ? editingTask : {}),
      title: title.trim(),
      description: description.trim(),
      day,
      time,
      priority,
      repeat,
    });
  };

  // Generate time options
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${isDarkMode ? "dark-mode" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="title-input"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <textarea
              className="description-input"
              placeholder="Add description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <select
                className="day-select"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={
                  !!editingTask &&
                  editingTask.repeat &&
                  editingTask.repeat !== "none"
                }
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select
                className="time-select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {formatTime(t, is24HourFormat)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <select
                className="priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <select
                className="repeat-select"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
              >
                <option value="none">No Repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              {editingTask ? "Update Task" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddTaskModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  selectedDay: PropTypes.string,
  days: PropTypes.arrayOf(PropTypes.string).isRequired,
  editingTask: PropTypes.object,
};

export default AddTaskModal;
