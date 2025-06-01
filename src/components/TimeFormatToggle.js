import React from "react";
import { useTimeFormat } from "../contexts/TimeFormatContext";
import { useTheme } from "../contexts/ThemeContext";
import { FiClock, FiMoon, FiSun } from "react-icons/fi";

const TimeFormatToggle = () => {
  const { timeFormat, toggleTimeFormat } = useTimeFormat();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="time-format-toggle">
      <button
        className={`format-toggle-button ${
          timeFormat === "24h" ? "active" : ""
        }`}
        onClick={toggleTimeFormat}
        title="Toggle time format"
      >
        <FiClock />
        {timeFormat === "24h" ? "24h" : "12h"}
      </button>
      <button
        className={`night-mode-button ${isDarkMode ? "active" : ""}`}
        onClick={toggleTheme}
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <FiSun /> : <FiMoon />}
      </button>
    </div>
  );
};

export default TimeFormatToggle;
