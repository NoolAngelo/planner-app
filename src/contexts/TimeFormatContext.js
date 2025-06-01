import React, { createContext, useContext, useState, useEffect } from "react";

const TimeFormatContext = createContext();

export const useTimeFormat = () => useContext(TimeFormatContext);

export const TimeFormatProvider = ({ children }) => {
  // Check if user previously set time format preference
  const [timeFormat, setTimeFormat] = useState(() => {
    const saved = localStorage.getItem("timeFormat");
    return saved !== null ? saved : "24h";
  });

  // Store time format preference
  useEffect(() => {
    localStorage.setItem("timeFormat", timeFormat);
  }, [timeFormat]);

  const toggleTimeFormat = () => {
    setTimeFormat((prev) => (prev === "24h" ? "12h" : "24h"));
  };

  return (
    <TimeFormatContext.Provider value={{ timeFormat, toggleTimeFormat }}>
      {children}
    </TimeFormatContext.Provider>
  );
};
