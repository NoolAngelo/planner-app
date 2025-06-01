import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../contexts/ThemeContext";
import { FiBell, FiX } from "react-icons/fi";

const TaskNotification = ({ tasks }) => {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Check for upcoming tasks and show notifications
    const checkUpcomingTasks = () => {
      const now = new Date();
      const today = now.toLocaleDateString("en-US", { weekday: "long" });
      const currentHour = now.getHours();
      const nextHour = (currentHour + 1) % 24;

      // Format for comparison
      const nextHourFormatted = `${nextHour.toString().padStart(2, "0")}:00`;

      // Find tasks in the next hour
      const upcomingTasks = [];

      if (tasks[today]) {
        tasks[today].forEach((task) => {
          if (task.time === nextHourFormatted && !task.completed) {
            upcomingTasks.push(task);
          }
        });
      }

      if (upcomingTasks.length > 0) {
        setNotifications(upcomingTasks);
        setShowNotification(true);

        // Auto hide after 10 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 10000);
      }
    };

    // Check immediately
    checkUpcomingTasks();

    // Set up interval to check every 15 minutes
    const intervalId = setInterval(checkUpcomingTasks, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [tasks]);

  if (!showNotification || notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="notification-header">
        <div className="notification-title">
          <FiBell />
          <span>Upcoming Tasks</span>
        </div>
        <button
          className="notification-close"
          onClick={() => setShowNotification(false)}
        >
          <FiX />
        </button>
      </div>
      <div className="notification-content">
        {notifications.map((task) => (
          <div key={task.id} className="notification-task">
            <div className="notification-time">{task.time}</div>
            <div className="notification-task-title">{task.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

TaskNotification.propTypes = {
  tasks: PropTypes.object.isRequired,
};

export default TaskNotification;
