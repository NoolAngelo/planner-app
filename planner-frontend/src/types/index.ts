export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  timezone: string;
  preferences: UserPreferences;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  timeFormat: "12h" | "24h";
  theme: "light" | "dark";
  language: string;
  weekStartDay: number;
  workingHours: {
    start: string;
    end: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  defaultView: "list" | "board" | "calendar" | "timeline";
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  ownerId: string;
  parentId?: string;
  order: number;
  isArchived: boolean;
  defaultView: "list" | "board" | "calendar" | "timeline";
  viewSettings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  children?: Project[];
  taskCount?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  startDate?: string;
  startTime?: string;
  duration?: number;
  allDay: boolean;
  priority: "1" | "2" | "3" | "4";
  status: "todo" | "in_progress" | "completed" | "cancelled";
  completedAt?: string;
  recurrence?: TaskRecurrence;
  userId: string;
  projectId?: string;
  parentTaskId?: string;
  timeTracking: TimeTracking;
  order: number;
  isArchived: boolean;
  isImportant: boolean;
  externalId?: string;
  externalSource?: string;
  reminders: TaskReminder[];
  progress: number;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  subtasks?: Task[];
  tags?: Tag[];
}

export interface TaskRecurrence {
  type: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  endAfterOccurrences?: number;
}

export interface TimeTracking {
  estimated?: number;
  actual: number;
  sessions: TimeSession[];
}

export interface TimeSession {
  start: string;
  end?: string;
  duration?: number;
  description?: string;
}

export interface TaskReminder {
  type: "absolute" | "relative";
  datetime?: string;
  minutesBefore?: number;
  method: "email" | "push" | "desktop";
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}
