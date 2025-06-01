module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    "Project",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Basic info
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: "#6366f1",
        validate: {
          is: /^#[0-9A-F]{6}$/i,
        },
      },
      icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Organization
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "projects",
          key: "id",
        },
      },

      // Settings
      isFolder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      defaultView: {
        type: DataTypes.ENUM("list", "calendar", "kanban", "timeline"),
        defaultValue: "list",
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      // Status
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isTemplate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      // Collaboration (for future implementation)
      isShared: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      shareSettings: {
        type: DataTypes.JSONB,
        defaultValue: {
          isPublic: false,
          allowComments: false,
          allowEditing: false,
        },
      },

      // Preferences
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          showCompletedTasks: false,
          taskGrouping: "none", // 'none', 'priority', 'dueDate', 'assignee'
          defaultTaskPriority: "3",
          autoArchiveCompleted: false,
        },
      },
    },
    {
      tableName: "projects",
      timestamps: true,
      indexes: [
        {
          fields: ["ownerId"],
        },
        {
          fields: ["parentId"],
        },
        {
          fields: ["name"],
        },
        {
          fields: ["isArchived"],
        },
      ],
    }
  );

  // Instance methods
  Project.prototype.getFullPath = async function () {
    let path = [this.name];
    let current = this;

    while (current.parentId) {
      const parent = await Project.findByPk(current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }

    return path.join(" / ");
  };

  Project.prototype.getTaskCount = async function (includeCompleted = false) {
    const { Task } = sequelize.models;
    const whereClause = { projectId: this.id };

    if (!includeCompleted) {
      whereClause.status = {
        [sequelize.Sequelize.Op.ne]: "completed",
      };
    }

    return await Task.count({ where: whereClause });
  };

  Project.prototype.getCompletionRate = async function () {
    const { Task } = sequelize.models;

    const totalTasks = await Task.count({
      where: { projectId: this.id },
    });

    if (totalTasks === 0) return 0;

    const completedTasks = await Task.count({
      where: {
        projectId: this.id,
        status: "completed",
      },
    });

    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Class methods
  Project.findByOwner = function (ownerId, options = {}) {
    return this.findAll({
      where: {
        ownerId,
        isArchived: false,
        ...options.where,
      },
      include: options.include || [],
      order: options.order || [
        ["sortOrder", "ASC"],
        ["name", "ASC"],
      ],
    });
  };

  Project.findRootProjects = function (ownerId) {
    return this.findAll({
      where: {
        ownerId,
        parentId: null,
        isArchived: false,
      },
      order: [
        ["sortOrder", "ASC"],
        ["name", "ASC"],
      ],
    });
  };

  Project.findFolders = function (ownerId) {
    return this.findAll({
      where: {
        ownerId,
        isFolder: true,
        isArchived: false,
      },
      order: [["name", "ASC"]],
    });
  };

  return Project;
};
