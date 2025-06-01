const express = require("express");
const { body, validationResult } = require("express-validator");
const { User, Task, Project, Tag } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching profile",
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put(
  "/profile",
  [
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be between 1 and 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be between 1 and 50 characters"),
    body("timezone")
      .optional()
      .isString()
      .withMessage("Timezone must be a valid string"),
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

      const { email, firstName, lastName, timezone, avatar } = req.body;

      // Check if email is already taken by another user
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: "Email is already taken",
          });
        }
      }

      // Update user
      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (avatar !== undefined) updateData.avatar = avatar;

      const user = await req.user.update(updateData);

      // Remove password from response
      const userWithoutPassword = { ...user.toJSON() };
      delete userWithoutPassword.password;

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while updating profile",
      });
    }
  }
);

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
router.put("/preferences", async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({
        success: false,
        error: "Preferences object is required",
      });
    }

    // Merge with existing preferences
    const currentPreferences = req.user.preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };

    await req.user.update({ preferences: updatedPreferences });

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while updating preferences",
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    const { timeframe = "30" } = req.query; // days
    const daysAgo = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    // Task statistics
    const taskStats = await Task.findAll({
      where: {
        userId: req.user.id,
        isArchived: false,
      },
      attributes: ["status", [req.models.sequelize.fn("COUNT", "*"), "count"]],
      group: ["status"],
      raw: true,
    });

    const taskStatsByStatus = taskStats.reduce(
      (acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      },
      {
        todo: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      }
    );

    taskStatsByStatus.total = Object.values(taskStatsByStatus).reduce(
      (sum, count) => sum + count,
      0
    );

    // Priority breakdown
    const priorityStats = await Task.findAll({
      where: {
        userId: req.user.id,
        isArchived: false,
        status: { [req.models.Sequelize.Op.ne]: "completed" },
      },
      attributes: [
        "priority",
        [req.models.sequelize.fn("COUNT", "*"), "count"],
      ],
      group: ["priority"],
      raw: true,
    });

    const taskStatsByPriority = priorityStats.reduce(
      (acc, stat) => {
        acc[`priority_${stat.priority}`] = parseInt(stat.count);
        return acc;
      },
      {
        priority_1: 0, // Highest
        priority_2: 0,
        priority_3: 0,
        priority_4: 0, // Lowest
      }
    );

    // Project statistics
    const projectCount = await Project.count({
      where: {
        userId: req.user.id,
        isArchived: false,
      },
    });

    // Recent activity (tasks completed in timeframe)
    const recentCompletions = await Task.count({
      where: {
        userId: req.user.id,
        status: "completed",
        completedAt: {
          [req.models.Sequelize.Op.gte]: dateFrom,
        },
      },
    });

    // Overdue tasks
    const overdueTasks = await Task.count({
      where: {
        userId: req.user.id,
        status: { [req.models.Sequelize.Op.ne]: "completed" },
        dueDate: { [req.models.Sequelize.Op.lt]: new Date() },
        isArchived: false,
      },
    });

    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.count({
      where: {
        userId: req.user.id,
        status: { [req.models.Sequelize.Op.ne]: "completed" },
        dueDate: {
          [req.models.Sequelize.Op.gte]: today,
          [req.models.Sequelize.Op.lt]: tomorrow,
        },
        isArchived: false,
      },
    });

    // Productivity metrics
    const totalTimeTracked =
      (await Task.sum("timeTracking.actual", {
        where: {
          userId: req.user.id,
          "timeTracking.actual": { [req.models.Sequelize.Op.gt]: 0 },
        },
      })) || 0;

    // Tag usage
    const tagCount = await Tag.count({
      where: { userId: req.user.id },
    });

    res.status(200).json({
      success: true,
      stats: {
        tasks: taskStatsByStatus,
        priorities: taskStatsByPriority,
        projects: {
          total: projectCount,
        },
        activity: {
          completedInTimeframe: recentCompletions,
          timeframe: `${daysAgo} days`,
        },
        urgent: {
          overdue: overdueTasks,
          dueToday: tasksDueToday,
        },
        productivity: {
          totalTimeTracked: Math.round(totalTimeTracked / 60), // Convert to hours
          totalTags: tagCount,
        },
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching statistics",
    });
  }
});

// @desc    Get user activity feed
// @route   GET /api/users/activity
// @access  Private
router.get("/activity", async (req, res) => {
  try {
    const { limit = 20, offset = 0, days = 7 } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(days));

    // Recent task completions
    const completedTasks = await Task.findAll({
      where: {
        userId: req.user.id,
        status: "completed",
        completedAt: {
          [req.models.Sequelize.Op.gte]: dateFrom,
        },
      },
      attributes: ["id", "title", "completedAt", "priority"],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "color"],
        },
      ],
      order: [["completedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Recent project creations
    const newProjects = await Project.findAll({
      where: {
        userId: req.user.id,
        createdAt: {
          [req.models.Sequelize.Op.gte]: dateFrom,
        },
      },
      attributes: ["id", "name", "createdAt", "color", "icon"],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Format activity feed
    const activity = [];

    // Add completed tasks
    completedTasks.forEach((task) => {
      activity.push({
        type: "task_completed",
        id: task.id,
        title: task.title,
        timestamp: task.completedAt,
        data: {
          priority: task.priority,
          project: task.project,
        },
      });
    });

    // Add new projects
    newProjects.forEach((project) => {
      activity.push({
        type: "project_created",
        id: project.id,
        title: project.name,
        timestamp: project.createdAt,
        data: {
          color: project.color,
          icon: project.icon,
        },
      });
    });

    // Sort by timestamp
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      activity: activity.slice(0, parseInt(limit)),
      total: activity.length,
    });
  } catch (error) {
    console.error("Get activity feed error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching activity",
    });
  }
});

// @desc    Deactivate user account
// @route   PATCH /api/users/deactivate
// @access  Private
router.patch("/deactivate", async (req, res) => {
  try {
    await req.user.update({
      isActive: false,
      deactivatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deactivating account",
    });
  }
});

// @desc    Reactivate user account
// @route   PATCH /api/users/reactivate
// @access  Private
router.patch("/reactivate", async (req, res) => {
  try {
    await req.user.update({
      isActive: true,
      deactivatedAt: null,
    });

    res.status(200).json({
      success: true,
      message: "Account reactivated successfully",
    });
  } catch (error) {
    console.error("Reactivate account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while reactivating account",
    });
  }
});

// @desc    Export user data
// @route   GET /api/users/export
// @access  Private
router.get("/export", async (req, res) => {
  try {
    const { format = "json" } = req.query;

    // Get all user data
    const userData = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Task,
          as: "tasks",
          include: [
            {
              model: Project,
              as: "project",
              attributes: ["id", "name"],
            },
            {
              model: Tag,
              as: "tags",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: Project,
          as: "projects",
        },
        {
          model: Tag,
          as: "tags",
        },
      ],
    });

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="planner-export-${Date.now()}.json"`
      );

      res.status(200).json({
        exportedAt: new Date(),
        user: userData,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Unsupported export format. Only 'json' is currently supported.",
      });
    }
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while exporting data",
    });
  }
});

module.exports = router;
