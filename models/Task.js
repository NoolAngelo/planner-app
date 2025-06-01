module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Basic info
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Time and scheduling
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      dueTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER, // in minutes
        allowNull: true,
        validate: {
          min: 1,
        },
      },
      allDay: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Priority and status
      priority: {
        type: DataTypes.ENUM("1", "2", "3", "4"), // 1=highest, 4=lowest (TickTick style)
        defaultValue: "3",
      },
      status: {
        type: DataTypes.ENUM("todo", "in_progress", "completed", "cancelled"),
        defaultValue: "todo",
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Recurrence
      recurrence: {
        type: DataTypes.JSONB,
        allowNull: true,
        // Example: { type: 'daily', interval: 1, endDate: '2024-12-31', exceptions: [] }
      },

      // Organization
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
      },
      parentTaskId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "tasks",
          key: "id",
        },
      },

      // Time tracking
      timeTracking: {
        type: DataTypes.JSONB,
        defaultValue: {
          estimated: null, // in minutes
          actual: 0, // in minutes
          sessions: [], // array of time tracking sessions
        },
      },

      // Metadata
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isImportant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // External integrations
      externalId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      externalSource: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Reminders
      reminders: {
        type: DataTypes.JSONB,
        defaultValue: [],
        // Example: [{ type: 'time', value: '2024-01-01T09:00:00Z' }, { type: 'location', value: 'Home' }]
      },

      // Progress (for subtasks)
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
    },
    {
      tableName: "tasks",
      timestamps: true,
      indexes: [
        {
          fields: ["userId"],
        },
        {
          fields: ["projectId"],
        },
        {
          fields: ["dueDate"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["priority"],
        },
        {
          fields: ["parentTaskId"],
        },
        {
          fields: ["createdAt"],
        },
      ],
      hooks: {
        beforeUpdate: (task) => {
          if (task.changed("status") && task.status === "completed") {
            task.completedAt = new Date();
          } else if (task.changed("status") && task.status !== "completed") {
            task.completedAt = null;
          }
        },
      },
    }
  );

  // Instance methods
  Task.prototype.markAsCompleted = function () {
    this.status = "completed";
    this.completedAt = new Date();
    return this.save();
  };

  Task.prototype.markAsIncomplete = function () {
    this.status = "todo";
    this.completedAt = null;
    return this.save();
  };

  Task.prototype.isOverdue = function () {
    if (!this.dueDate) return false;
    if (this.status === "completed") return false;

    const now = new Date();
    const dueDateTime = new Date(this.dueDate);

    if (this.dueTime) {
      const [hours, minutes] = this.dueTime.split(":");
      dueDateTime.setHours(parseInt(hours), parseInt(minutes));
    } else {
      dueDateTime.setHours(23, 59, 59); // End of day if no specific time
    }

    return now > dueDateTime;
  };

  Task.prototype.getDueDateTimeString = function () {
    if (!this.dueDate) return null;

    let dateTime = this.dueDate;
    if (this.dueTime) {
      dateTime += ` ${this.dueTime}`;
    }
    return dateTime;
  };

  Task.prototype.calculateProgress = async function () {
    if (!this.parentTaskId) {
      // This is a parent task, calculate progress based on subtasks
      const subtasks = await Task.findAll({
        where: { parentTaskId: this.id },
      });

      if (subtasks.length === 0) {
        return this.status === "completed" ? 100 : 0;
      }

      const completedSubtasks = subtasks.filter(
        (subtask) => subtask.status === "completed"
      );
      const progress = Math.round(
        (completedSubtasks.length / subtasks.length) * 100
      );

      this.progress = progress;
      await this.save();

      return progress;
    }

    return this.progress;
  };

  // Class methods
  Task.findByUser = function (userId, options = {}) {
    return this.findAll({
      where: { userId, ...options.where },
      include: options.include || [],
      order: options.order || [["createdAt", "DESC"]],
    });
  };

  Task.findUpcoming = function (userId, days = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);

    return this.findAll({
      where: {
        userId,
        dueDate: {
          [sequelize.Sequelize.Op.between]: [
            now.toISOString().split("T")[0],
            future.toISOString().split("T")[0],
          ],
        },
        status: {
          [sequelize.Sequelize.Op.ne]: "completed",
        },
      },
      order: [
        ["dueDate", "ASC"],
        ["dueTime", "ASC"],
      ],
    });
  };

  Task.findOverdue = function (userId) {
    const now = new Date().toISOString().split("T")[0];

    return this.findAll({
      where: {
        userId,
        dueDate: {
          [sequelize.Sequelize.Op.lt]: now,
        },
        status: {
          [sequelize.Sequelize.Op.ne]: "completed",
        },
      },
      order: [["dueDate", "ASC"]],
    });
  };

  return Task;
};
