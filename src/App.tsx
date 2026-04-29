import { useEffect, useState } from "react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string;
  category: string;
}

const CATEGORIES = ["Personal", "Work", "Health", "Errands"];

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Personal":
      return "bg-[#F2E8E3] text-[#715C53]";
    case "Work":
      return "bg-[#EAEBEA] text-[#595E5D]";
    case "Health":
      return "bg-[#E2EBE5] text-[#556B5D]";
    case "Errands":
      return "bg-[#F5E6E0] text-[#8C5A46]";
    default:
      return "bg-[#ECEADF] text-[#6B5A4E]";
  }
};

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("planner-tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tasks from local storage");
      }
    }
    return [];
  });

  const [newTask, setNewTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Enhanced Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    localStorage.setItem("planner-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
      dueDate: dueDate,
      category: category,
    };

    setTasks([...tasks, task]);
    setNewTask("");
    setDueDate("");
  };

  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditDueDate(task.dueDate || "");
    setEditCategory(task.category || CATEGORIES[0]);
  };

  const saveEdit = (id: string) => {
    // If they wipe out the text completely, we cancel the edit instead of saving a blank task
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }

    setTasks(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              text: editText.trim(),
              dueDate: editDueDate,
              category: editCategory,
            }
          : t,
      ),
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-[#F4F1EA] py-12 px-4 font-sans text-[#4A3B32] selection:bg-[#D4C8BE] selection:text-[#4A3B32]">
      <div className="max-w-2xl mx-auto bg-[#FBF9F6] rounded-3xl shadow-sm border border-[#E8E3D9] overflow-hidden p-8 hover:shadow-md transition-shadow duration-500">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-serif text-[#4A3B32] mb-2 pt-2 tracking-tight flex items-center justify-center gap-3">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8C7A6D"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
              <path d="M3 8v8a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V8H3Z"></path>
              <path d="M6 5v-2"></path>
              <path d="M10 5v-2"></path>
              <path d="M14 5v-2"></path>
            </svg>
            Cafe Planner
          </h1>
          <p className="text-[#8C7A6D] text-sm font-medium tracking-wide uppercase">
            Brew great ideas today
          </p>
        </header>

        {/* ADD TASK FORM */}
        <form
          onSubmit={addTask}
          className="mb-10 bg-[#F4F1EA]/60 p-5 rounded-2xl border border-[#E8E3D9] shadow-inner"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What's brewing today?"
              className="flex-1 px-5 py-3 text-[#4A3B32] border border-[#E8E3D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BAA89B] focus:border-transparent transition-all bg-[#FBF9F6] placeholder:text-[#B5ACA3] shadow-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-1 gap-4 text-sm font-medium">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-1/2 px-4 py-2.5 border border-[#E8E3D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BAA89B] bg-[#FBF9F6] text-[#6B5A4E] cursor-pointer shadow-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-1/2 px-4 py-2.5 border border-[#E8E3D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BAA89B] bg-[#FBF9F6] text-[#6B5A4E] cursor-pointer shadow-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="px-8 py-2.5 bg-[#4A3B32] text-[#FBF9F6] font-medium rounded-xl hover:bg-[#3A2B22] focus:ring-4 focus:ring-[#D4C8BE] transition-all disabled:opacity-50 disabled:hover:bg-[#4A3B32] shadow-sm active:scale-95"
            >
              Add
            </button>
          </div>
        </form>

        {/* TASK LIST */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-14 px-4 rounded-2xl border-2 border-dashed border-[#E8E3D9] bg-[#F4F1EA]/30">
              <p className="text-[#8C7A6D] text-lg font-serif italic">
                Your planner is quietly empty.
              </p>
              <p className="text-[#B5ACA3] text-sm mt-2">
                Pour a coffee and add a task to begin.
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`flex flex-col sm:flex-row sm:items-start justify-between p-5 rounded-2xl border transition-all duration-300 group ${
                  task.completed && editingId !== task.id
                    ? "bg-[#F4F1EA]/40 border-[#E8E3D9]/60 opacity-70 cursor-default"
                    : "bg-[#FBF9F6] border-[#E8E3D9] shadow-[0_2px_8px_-4px_rgba(74,59,50,0.1)] hover:shadow-md hover:border-[#D4C8BE]"
                }`}
              >
                <div className="flex items-start gap-4 flex-1 w-full">
                  <button
                    type="button"
                    onClick={() => toggleComplete(task.id)}
                    aria-label={
                      task.completed ? "Mark incomplete" : "Mark complete"
                    }
                    className={`shrink-0 w-6 h-6 mt-1 rounded-full border-2 flex items-center justify-center transition-all duration-200 outline-none focus:ring-2 focus:ring-[#8C7A6D] focus:ring-offset-2 focus:ring-offset-[#FBF9F6] ${
                      task.completed
                        ? "bg-[#8C7A6D] border-[#8C7A6D]"
                        : "bg-[#FBF9F6] border-[#D4C8BE] hover:border-[#BAA89B]"
                    }`}
                  >
                    {task.completed && (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0 w-full">
                    {editingId === task.id ? (
                      <div
                        className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200"
                        onBlur={(e) => {
                          // Crucial logic: only save if the user clicks completely outside of this form block
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            saveEdit(task.id);
                          }
                        }}
                      >
                        <textarea
                          value={editText}
                          onChange={(e) => {
                            setEditText(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height =
                              e.target.scrollHeight + "px";
                          }}
                          onFocus={(e) => {
                            // Auto-resize on open & place cursor at the very end
                            e.target.style.height = "auto";
                            e.target.style.height =
                              e.target.scrollHeight + "px";
                            e.target.setSelectionRange(
                              e.target.value.length,
                              e.target.value.length,
                            );
                          }}
                          onKeyDown={(e) => {
                            // Save on Enter, but allow Shift+Enter for newlines
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveEdit(task.id);
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full px-3 py-2 text-[#4A3B32] border border-[#BAA89B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C7A6D] bg-[#FBF9F6] resize-none overflow-hidden transition-shadow"
                          rows={1}
                          autoFocus
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="px-3 py-1.5 text-xs font-semibold border border-[#E8E3D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C7A6D] bg-[#FBF9F6] text-[#6B5A4E]"
                          />
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="px-3 py-1.5 text-xs font-semibold border border-[#E8E3D9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8C7A6D] bg-[#FBF9F6] text-[#6B5A4E]"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>

                          <div className="ml-auto flex gap-2 pt-1 sm:pt-0">
                            <button
                              onClick={() => saveEdit(task.id)}
                              className="text-[#556B5D] hover:text-[#384A40] text-sm font-semibold px-3 py-1.5 bg-[#E2EBE5] hover:bg-[#D5E0D9] shadow-sm rounded-md transition-colors"
                            >
                              Done
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-[#8C7A6D] hover:text-[#6B5A4E] text-sm font-semibold px-3 py-1.5 bg-[#ECEADF] hover:bg-[#E3DFD2] shadow-sm rounded-md transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-0.5">
                        <span
                          onDoubleClick={() => startEditing(task)}
                          title="Double-click to edit"
                          className={`block text-[1.15rem] leading-relaxed font-medium transition-colors cursor-text whitespace-pre-wrap break-words ${
                            task.completed
                              ? "line-through text-[#A89F95]"
                              : "text-[#4A3B32]"
                          }`}
                        >
                          {task.text}
                        </span>

                        <div className="flex items-center flex-wrap gap-2 mt-2 text-xs font-bold">
                          {task.category && (
                            <span
                              className={`px-2.5 py-1 rounded-md uppercase tracking-wider text-[9px] shadow-sm ${
                                task.completed
                                  ? "bg-[#E8E3D9] text-[#A89F95]"
                                  : getCategoryStyles(task.category)
                              }`}
                            >
                              {task.category}
                            </span>
                          )}
                          {task.dueDate && (
                            <span
                              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 tracking-wide text-[10px] shadow-sm ${
                                task.completed
                                  ? "bg-[#E8E3D9] text-[#A89F95]"
                                  : new Date(task.dueDate + "T00:00:00") < today
                                    ? "bg-[#F0D9D9] text-[#8C4A4A]"
                                    : "bg-[#ECEADF] text-[#6B5A4E]"
                              }`}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {new Date(
                                task.dueDate + "T00:00:00",
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!editingId && (
                  <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end ml-10 sm:ml-0 shrink-0">
                    <button
                      onClick={() => startEditing(task)}
                      className="p-2 text-[#8C7A6D] hover:text-[#4A3B32] hover:bg-[#ECEADF] rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-[#A87979] hover:text-[#8C4A4A] hover:bg-[#F0D9D9] rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
