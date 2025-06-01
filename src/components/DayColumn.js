import React, { useState, useEffect, useRef } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";
import EmptyState from "./EmptyState";
import PropTypes from "prop-types";
import { useTimeFormat } from "../contexts/TimeFormatContext";

const formatTime = (time, is24HourFormat) => {
  if (is24HourFormat) return time;

  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getCurrentTimePosition = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours + minutes / 60;
};

const isToday = (day) => {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return day === today;
};

const DayColumn = ({
  day,
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleComplete,
  onEdit,
  isDragging,
}) => {
  const { timeFormat } = useTimeFormat();
  const is24HourFormat = timeFormat === "24h";
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [currentTimePosition, setCurrentTimePosition] = useState(
    getCurrentTimePosition()
  );
  const columnRef = useRef(null);
  const isCurrentDay = isToday(day);
  const dayTasks = tasks[day] || [];
  const isEmpty = dayTasks.length === 0;

  // Update time blocks when tasks change
  useEffect(() => {
    const blocks = Array.from({ length: 24 }, (_, i) => {
      const time = `${i.toString().padStart(2, "0")}:00`;
      return {
        time,
        droppableId: `${day}-${time}`,
        tasks: (tasks[day] || []).filter((task) => task.time === time),
      };
    });
    setTimeBlocks(blocks);
  }, [day, tasks]);

  // Update current time position every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTimePosition(getCurrentTimePosition());
    };

    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Scroll to current time when column is mounted
  useEffect(() => {
    if (isCurrentDay && columnRef.current) {
      const scrollPos = (currentTimePosition - 1) * 48; // 48px is the height of time block
      columnRef.current.scrollTop = scrollPos;
    }
  }, [isCurrentDay, currentTimePosition]);

  return (
    <div
      className={`day-column ${isCurrentDay ? "today" : ""}`}
      ref={columnRef}
    >
      <div className="day-header">
        <h3 className="day-name">{day.slice(0, 3).toUpperCase()}</h3>
        <button className="add-button" onClick={() => onAddTask(day)}>
          +
        </button>
      </div>

      {isEmpty ? (
        <EmptyState onAddFirst={onAddTask} day={day} />
      ) : (
        <div className="timeline-view">
          <div className="time-markers">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="time-marker">
                {formatTime(
                  `${i.toString().padStart(2, "0")}:00`,
                  is24HourFormat
                )}
              </div>
            ))}
          </div>
          <div className="time-blocks-container">
            {isCurrentDay && (
              <div
                className="current-time-indicator"
                style={{ top: `${currentTimePosition * 48}px` }}
              >
                <div className="current-time-marker"></div>
              </div>
            )}
            {timeBlocks.map(({ time, droppableId, tasks: timeTasks }) => (
              <Droppable
                key={droppableId}
                droppableId={droppableId}
                isDropDisabled={isDragging}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`time-block ${
                      snapshot.isDraggingOver ? "dragging-over" : ""
                    }`}
                    style={{
                      minHeight:
                        timeTasks.length > 0
                          ? `${timeTasks.length * 60}px`
                          : "40px",
                    }}
                  >
                    {timeTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TaskCard
                            provided={provided}
                            snapshot={snapshot}
                            task={task}
                            onDelete={() => onDeleteTask(task.id, day)}
                            onToggleComplete={onToggleComplete}
                            onEdit={onEdit}
                            is24HourFormat={is24HourFormat}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

DayColumn.propTypes = {
  day: PropTypes.string.isRequired,
  tasks: PropTypes.object.isRequired,
  onAddTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
};

export default DayColumn;
