import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../contexts/ThemeContext";

const TaskStatistics = ({ tasks }) => {
  const { isDarkMode } = useTheme();

  // Calculate statistics
  const calculateStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    let highPriorityTasks = 0;
    let upcomingTasks = 0;

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
    const currentHour = today.getHours();

    Object.entries(tasks).forEach(([day, dayTasks]) => {
      totalTasks += dayTasks.length;

      dayTasks.forEach((task) => {
        if (task.completed) {
          completedTasks++;
        }

        if (task.priority === "high") {
          highPriorityTasks++;
        }

        // Check if task is upcoming (today and hour is greater than current hour)
        if (day === dayOfWeek) {
          const taskHour = parseInt(task.time.split(":")[0], 10);
          if (taskHour > currentHour) {
            upcomingTasks++;
          }
        }
      });
    });

    return {
      totalTasks,
      completedTasks,
      highPriorityTasks,
      upcomingTasks,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  };

  const stats = calculateStats();

  return (
    <div className={`task-stats ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="stat-card">
        <div className="stat-value">{stats.totalTasks}</div>
        <div className="stat-label">Total Tasks</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.upcomingTasks}</div>
        <div className="stat-label">Today's Upcoming</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.highPriorityTasks}</div>
        <div className="stat-label">High Priority</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.completionRate}%</div>
        <div className="stat-label">Completion Rate</div>
      </div>
    </div>
  );
};

TaskStatistics.propTypes = {
  tasks: PropTypes.object.isRequired,
};

export default TaskStatistics;
