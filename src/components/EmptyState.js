import React from "react";
import PropTypes from "prop-types";
import { FiCalendar } from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";

const EmptyState = ({ onAddFirst, day }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`empty-day ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="empty-day-icon">
        <FiCalendar />
      </div>
      <div className="empty-day-text">No tasks scheduled for {day}</div>
      <button className="empty-state-button" onClick={() => onAddFirst(day)}>
        Add Your First Task
      </button>
    </div>
  );
};

EmptyState.propTypes = {
  onAddFirst: PropTypes.func.isRequired,
  day: PropTypes.string.isRequired,
};

export default EmptyState;
