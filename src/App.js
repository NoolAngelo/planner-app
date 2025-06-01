import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import DayColumn from "./components/DayColumn";
import AddTaskModal from "./components/AddTaskModal";
import TimeFormatToggle from "./components/TimeFormatToggle";
import TaskStatistics from "./components/TaskStatistics";
import TaskNotification from "./components/TaskNotification";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TimeFormatProvider } from "./contexts/TimeFormatContext";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // New state
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState("all");
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Initialize tasks for each day
  useEffect(() => {
    const initialTasks = {};
    days.forEach((day) => {
      initialTasks[day] = [];
    });
    setTasks(initialTasks);
  }, []);

  // Add or update task
  const handleAddOrEditTask = useCallback((task) => {
    setTasks((prevTasks) => {
      let newTasks = { ...prevTasks };
      // If editing, update the task
      if (task.id) {
        newTasks[task.day] = newTasks[task.day].map((t) =>
          t.id === task.id ? { ...t, ...task } : t
        );
      } else {
        // New task
        newTasks[task.day] = [
          ...(newTasks[task.day] || []),
          { ...task, id: Date.now().toString(), completed: false },
        ];
      }
      localStorage.setItem("tasks", JSON.stringify(newTasks));
      return newTasks;
    });
    setShowModal(false);
    setEditingTask(null);
  }, []);

  const handleDeleteTask = useCallback((taskId, day) => {
    setTasks((prevTasks) => {
      const newTasks = {
        ...prevTasks,
        [day]: prevTasks[day].filter((task) => task.id !== taskId),
      };
      // Save to localStorage
      localStorage.setItem("tasks", JSON.stringify(newTasks));
      return newTasks;
    });
  }, []);

  const handleToggleTaskComplete = useCallback((taskId, day) => {
    setTasks((prevTasks) => {
      const newTasks = {
        ...prevTasks,
        [day]: prevTasks[day].map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      };
      // Save to localStorage
      localStorage.setItem("tasks", JSON.stringify(newTasks));
      return newTasks;
    });
  }, []);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    }
  }, []);

  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback((result) => {
    setIsDragging(false);
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) return;

    const [sourceDay, sourceTime] = source.droppableId.split("-");
    const [destDay, destTime] = destination.droppableId.split("-");

    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };

      // If dropped in the same time slot
      if (source.droppableId === destination.droppableId) {
        const dayTasks = [...(newTasks[sourceDay] || [])];
        const [removed] = dayTasks.splice(source.index, 1);
        dayTasks.splice(destination.index, 0, removed);
        newTasks[sourceDay] = dayTasks;
      } else {
        // Moving between different time slots or days
        const sourceTasks = [...(newTasks[sourceDay] || [])];
        const destTasks = [...(newTasks[destDay] || [])];
        const [removed] = sourceTasks.splice(source.index, 1);

        // Update the time and day
        removed.day = destDay;
        removed.time = destTime;

        destTasks.splice(destination.index, 0, removed);
        newTasks[sourceDay] = sourceTasks;
        newTasks[destDay] = destTasks;
      }

      // Save to localStorage
      localStorage.setItem("tasks", JSON.stringify(newTasks));
      return newTasks;
    });
  }, []);

  // Edit handler
  const handleEditTask = useCallback((task) => {
    setEditingTask(task);
    setSelectedDay(task.day);
    setShowModal(true);
  }, []);

  // Recurring task logic in getFilteredTasks
  const getFilteredTasks = useCallback(() => {
    // Helper to get day of week string
    const getDayOfWeek = (date) =>
      date.toLocaleDateString("en-US", { weekday: "long" });
    // Today's day string
    const today = getDayOfWeek(new Date());
    // Clone tasks
    let filteredTasks = JSON.parse(JSON.stringify(tasks));
    // Add recurring tasks for today if not present
    Object.keys(tasks).forEach((day) => {
      tasks[day].forEach((task) => {
        if (task.repeat === "daily" && today !== day) {
          // If not already present for today, add a virtual instance
          if (
            !filteredTasks[today].some(
              (t) => t.id === task.id + "-recurring-daily"
            )
          ) {
            filteredTasks[today].push({
              ...task,
              id: task.id + "-recurring-daily",
              day: today,
              isRecurringInstance: true,
            });
          }
        }
        if (task.repeat === "weekly" && today === day) {
          // If not already present for today, add a virtual instance
          if (
            !filteredTasks[today].some(
              (t) => t.id === task.id + "-recurring-weekly"
            )
          ) {
            filteredTasks[today].push({
              ...task,
              id: task.id + "-recurring-weekly",
              day: today,
              isRecurringInstance: true,
            });
          }
        }
      });
    });
    // Now apply filter
    Object.keys(filteredTasks).forEach((day) => {
      switch (filter) {
        case "today":
          if (day !== today) filteredTasks[day] = [];
          break;
        case "high":
          filteredTasks[day] = filteredTasks[day].filter(
            (task) => task.priority === "high"
          );
          break;
        case "unfinished":
          filteredTasks[day] = filteredTasks[day].filter(
            (task) => !task.completed
          );
          break;
        default:
          break;
      }
    });
    return filteredTasks;
  }, [tasks, filter]);

  const filteredTasks = getFilteredTasks();

  return (
    <ThemeProvider>
      <TimeFormatProvider>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="app">
            <div className="main-content">
              <div className="app-header">
                <h1 className="app-title">Weekly Planner</h1>
                <TimeFormatToggle />
              </div>
              <TaskStatistics tasks={tasks} />
              <div className="filter-controls">
                <button
                  className={`filter-button ${
                    filter === "all" ? "active" : ""
                  }`}
                  onClick={() => setFilter("all")}
                >
                  All Tasks
                </button>
                <button
                  className={`filter-button ${
                    filter === "today" ? "active" : ""
                  }`}
                  onClick={() => setFilter("today")}
                >
                  Today
                </button>
                <button
                  className={`filter-button ${
                    filter === "high" ? "active" : ""
                  }`}
                  onClick={() => setFilter("high")}
                >
                  High Priority
                </button>
                <button
                  className={`filter-button ${
                    filter === "unfinished" ? "active" : ""
                  }`}
                  onClick={() => setFilter("unfinished")}
                >
                  Unfinished
                </button>
              </div>
              <div className="days-container">
                {days.map((day) => (
                  <DayColumn
                    key={day}
                    day={day}
                    tasks={filteredTasks}
                    onAddTask={(day) => {
                      setSelectedDay(day);
                      setShowModal(true);
                      setEditingTask(null);
                    }}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleTaskComplete}
                    onEdit={handleEditTask}
                    isDragging={isDragging}
                  />
                ))}
              </div>
            </div>
            {(showModal || editingTask) && (
              <AddTaskModal
                onClose={() => {
                  setShowModal(false);
                  setEditingTask(null);
                }}
                onSubmit={handleAddOrEditTask}
                selectedDay={selectedDay}
                days={days}
                editingTask={editingTask}
              />
            )}
            <TaskNotification tasks={tasks} />
          </div>
        </DragDropContext>
      </TimeFormatProvider>
    </ThemeProvider>
  );
}

export default App;
