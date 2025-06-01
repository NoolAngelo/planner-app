const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const {
  Task,
  Project,
  Tag,
  TaskTag,
  User,
  Comment,
  Attachment,
} = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Helper function to build task query filters
const buildTaskFilters = (userId, queryParams) => {
  const where = { userId };

  // Status filter
  if (queryParams.status) {
    where.status = queryParams.status;
  }

  // Priority filter
  if (queryParams.priority) {
    where.priority = queryParams.priority;
  }

  // Project filter
  if (queryParams.projectId) {
    where.projectId = queryParams.projectId;
  }

  // Due date filters
  if (queryParams.dueBefore) {
    where.dueDate = { [Op.lte]: queryParams.dueBefore };
  }
  if (queryParams.dueAfter) {
    where.dueDate = { [Op.gte]: queryParams.dueAfter };
  }

  // Overdue filter
  if (queryParams.overdue === "true") {
    where.dueDate = { [Op.lt]: new Date() };
    where.status = { [Op.ne]: "completed" };
  }

  // Important filter
  if (queryParams.important === "true") {
    where.isImportant = true;
  }

  // Parent task filter (for subtasks)
  if (queryParams.parentTaskId) {
    where.parentTaskId = queryParams.parentTaskId;
  } else if (queryParams.topLevel === "true") {
    where.parentTaskId = null;
  }

  // Archive filter
  if (queryParams.archived !== "true") {
    where.isArchived = false;
  }

  // Search filter
  if (queryParams.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${queryParams.search}%` } },
      { description: { [Op.iLike]: `%${queryParams.search}%` } },
    ];
  }

  return where;
};

// @desc    Get all tasks for the authenticated user
// @route   GET /api/tasks
// @access  Private
router.get("/", async (req, res) => {
  try {
    const where = buildTaskFilters(req.user.id, req.query);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "color", "icon"],
        },
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "name", "color"],
          through: { attributes: [] },
        },
        {
          model: Task,
          as: "subtasks",
          attributes: ["id", "title", "status", "progress", "dueDate"],
        },
        {
          model: Task,
          as: "parentTask",
          attributes: ["id", "title"],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    // Calculate statistics
    const stats = await Task.findAll({
      where: { userId: req.user.id, isArchived: false },
      attributes: ["status", [req.models.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"],
      raw: true,
    });

    const taskStats = stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: tasks.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      stats: taskStats,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching tasks",
    });
  }
});

// @desc    Get single task with full details
// @route   GET /api/tasks/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "color", "icon"],
        },
        {
          model: Tag,
          as: "tags",
          through: { attributes: [] },
        },
        {
          model: Task,
          as: "subtasks",
          include: [
            {
              model: Tag,
              as: "tags",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: Task,
          as: "parentTask",
          attributes: ["id", "title", "status"],
        },
        {
          model: Comment,
          as: "comments",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
        {
          model: Attachment,
          as: "attachments",
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching task",
    });
  }
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post(
  "/",
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title is required and must be less than 255 characters"),
    body("description").optional().trim(),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Due date must be a valid date"),
    body("priority")
      .optional()
      .isIn(["1", "2", "3", "4"])
      .withMessage("Priority must be 1, 2, 3, or 4"),
    body("projectId")
      .optional()
      .isUUID()
      .withMessage("Project ID must be a valid UUID"),
    body("parentTaskId")
      .optional()
      .isUUID()
      .withMessage("Parent task ID must be a valid UUID"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        title,
        description,
        dueDate,
        dueTime,
        startDate,
        startTime,
        duration,
        allDay,
        priority,
        projectId,
        parentTaskId,
        recurrence,
        reminders,
        timeTracking,
        isImportant,
        tags,
      } = req.body;

      // Validate project ownership if projectId provided
      if (projectId) {
        const project = await Project.findOne({
          where: { id: projectId, userId: req.user.id },
        });
        if (!project) {
          return res.status(400).json({
            success: false,
            error: "Project not found or access denied",
          });
        }
      }

      // Validate parent task ownership if parentTaskId provided
      if (parentTaskId) {
        const parentTask = await Task.findOne({
          where: { id: parentTaskId, userId: req.user.id },
        });
        if (!parentTask) {
          return res.status(400).json({
            success: false,
            error: "Parent task not found or access denied",
          });
        }
      }

      // Create task
      const task = await Task.create({
        title,
        description,
        dueDate,
        dueTime,
        startDate,
        startTime,
        duration,
        allDay: allDay || false,
        priority: priority || "3",
        projectId,
        parentTaskId,
        recurrence,
        reminders: reminders || [],
        timeTracking: timeTracking || {
          estimated: null,
          actual: 0,
          sessions: [],
        },
        isImportant: isImportant || false,
        userId: req.user.id,
      });

      // Handle tags if provided
      if (tags && Array.isArray(tags)) {
        const tagPromises = tags.map(async (tagId) => {
          const tag = await Tag.findOne({
            where: { id: tagId, userId: req.user.id },
          });
          if (tag) {
            await TaskTag.create({
              taskId: task.id,
              tagId: tag.id,
            });
          }
        });
        await Promise.all(tagPromises);
      }

      // Fetch the created task with includes
      const createdTask = await Task.findByPk(task.id, {
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "color", "icon"],
          },
          {
            model: Tag,
            as: "tags",
            through: { attributes: [] },
          },
          {
            model: Task,
            as: "parentTask",
            attributes: ["id", "title"],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        task: createdTask,
      });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while creating task",
      });
    }
  }
);

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title must be between 1 and 255 characters"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Due date must be a valid date"),
    body("priority")
      .optional()
      .isIn(["1", "2", "3", "4"])
      .withMessage("Priority must be 1, 2, 3, or 4"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const task = await Task.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      const {
        title,
        description,
        dueDate,
        dueTime,
        startDate,
        startTime,
        duration,
        allDay,
        priority,
        projectId,
        status,
        recurrence,
        reminders,
        timeTracking,
        isImportant,
        tags,
      } = req.body;

      // Validate project ownership if projectId provided
      if (projectId && projectId !== task.projectId) {
        const project = await Project.findOne({
          where: { id: projectId, userId: req.user.id },
        });
        if (!project) {
          return res.status(400).json({
            success: false,
            error: "Project not found or access denied",
          });
        }
      }

      // Update task
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (dueTime !== undefined) updateData.dueTime = dueTime;
      if (startDate !== undefined) updateData.startDate = startDate;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (duration !== undefined) updateData.duration = duration;
      if (allDay !== undefined) updateData.allDay = allDay;
      if (priority !== undefined) updateData.priority = priority;
      if (projectId !== undefined) updateData.projectId = projectId;
      if (status !== undefined) updateData.status = status;
      if (recurrence !== undefined) updateData.recurrence = recurrence;
      if (reminders !== undefined) updateData.reminders = reminders;
      if (timeTracking !== undefined) updateData.timeTracking = timeTracking;
      if (isImportant !== undefined) updateData.isImportant = isImportant;

      await task.update(updateData);

      // Handle tags if provided
      if (tags && Array.isArray(tags)) {
        // Remove existing tags
        await TaskTag.destroy({
          where: { taskId: task.id },
        });

        // Add new tags
        const tagPromises = tags.map(async (tagId) => {
          const tag = await Tag.findOne({
            where: { id: tagId, userId: req.user.id },
          });
          if (tag) {
            await TaskTag.create({
              taskId: task.id,
              tagId: tag.id,
            });
          }
        });
        await Promise.all(tagPromises);
      }

      // Fetch updated task with includes
      const updatedTask = await Task.findByPk(task.id, {
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "color", "icon"],
          },
          {
            model: Tag,
            as: "tags",
            through: { attributes: [] },
          },
          {
            model: Task,
            as: "subtasks",
            attributes: ["id", "title", "status", "progress"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Task updated successfully",
        task: updatedTask,
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while updating task",
      });
    }
  }
);

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Check if task has subtasks
    const subtaskCount = await Task.count({
      where: { parentTaskId: task.id },
    });

    if (subtaskCount > 0 && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete task with subtasks. Use ?force=true to delete all subtasks.",
        subtaskCount,
      });
    }

    // Delete subtasks if force is true
    if (subtaskCount > 0) {
      await Task.destroy({
        where: { parentTaskId: task.id },
      });
    }

    // Delete task tags
    await TaskTag.destroy({
      where: { taskId: task.id },
    });

    // Delete the task
    await task.destroy();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting task",
    });
  }
});

// @desc    Toggle task completion
// @route   PATCH /api/tasks/:id/complete
// @access  Private
router.patch("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    // Toggle completion status
    const newStatus = task.status === "completed" ? "todo" : "completed";
    const completedAt = newStatus === "completed" ? new Date() : null;

    await task.update({
      status: newStatus,
      completedAt,
    });

    res.status(200).json({
      success: true,
      message: `Task marked as ${newStatus}`,
      task: {
        id: task.id,
        status: task.status,
        completedAt: task.completedAt,
      },
    });
  } catch (error) {
    console.error("Toggle task completion error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while updating task",
    });
  }
});

// @desc    Archive/Unarchive task
// @route   PATCH /api/tasks/:id/archive
// @access  Private
router.patch("/:id/archive", async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    await task.update({
      isArchived: !task.isArchived,
    });

    res.status(200).json({
      success: true,
      message: `Task ${task.isArchived ? "archived" : "unarchived"}`,
      task: {
        id: task.id,
        isArchived: task.isArchived,
      },
    });
  } catch (error) {
    console.error("Archive task error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while archiving task",
    });
  }
});

// @desc    Bulk operations on tasks
// @route   POST /api/tasks/bulk
// @access  Private
router.post("/bulk", async (req, res) => {
  try {
    const { action, taskIds, data } = req.body;

    if (!action || !taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({
        success: false,
        error: "Action and taskIds array are required",
      });
    }

    // Verify all tasks belong to the user
    const tasks = await Task.findAll({
      where: {
        id: { [Op.in]: taskIds },
        userId: req.user.id,
      },
    });

    if (tasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        error: "Some tasks not found or access denied",
      });
    }

    let updateData = {};
    let message = "";

    switch (action) {
      case "complete":
        updateData = { status: "completed", completedAt: new Date() };
        message = "Tasks marked as completed";
        break;
      case "incomplete":
        updateData = { status: "todo", completedAt: null };
        message = "Tasks marked as incomplete";
        break;
      case "archive":
        updateData = { isArchived: true };
        message = "Tasks archived";
        break;
      case "unarchive":
        updateData = { isArchived: false };
        message = "Tasks unarchived";
        break;
      case "delete":
        await Task.destroy({
          where: {
            id: { [Op.in]: taskIds },
            userId: req.user.id,
          },
        });
        return res.status(200).json({
          success: true,
          message: "Tasks deleted successfully",
        });
      case "update":
        if (!data) {
          return res.status(400).json({
            success: false,
            error: "Update data is required",
          });
        }
        updateData = data;
        message = "Tasks updated";
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }

    await Task.update(updateData, {
      where: {
        id: { [Op.in]: taskIds },
        userId: req.user.id,
      },
    });

    res.status(200).json({
      success: true,
      message,
      affectedCount: tasks.length,
    });
  } catch (error) {
    console.error("Bulk operation error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during bulk operation",
    });
  }
});

module.exports = router;
