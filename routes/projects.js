const express = require("express");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Project, Task, User } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all projects for the authenticated user
// @route   GET /api/projects
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { includeArchived, includeStats, search, sortBy, sortOrder } =
      req.query;

    const where = { userId: req.user.id };

    // Filter archived projects
    if (includeArchived !== "true") {
      where.isArchived = false;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Sorting
    const order = [];
    if (sortBy) {
      order.push([sortBy, sortOrder === "asc" ? "ASC" : "DESC"]);
    } else {
      order.push(["order", "ASC"], ["createdAt", "DESC"]);
    }

    const projects = await Project.findAll({
      where,
      include: [
        {
          model: Project,
          as: "subprojects",
          attributes: ["id", "name", "color", "icon", "isArchived"],
        },
        {
          model: Project,
          as: "parentProject",
          attributes: ["id", "name"],
        },
      ],
      order,
    });

    // Include task statistics if requested
    if (includeStats === "true") {
      const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
          const taskStats = await Task.findAll({
            where: {
              projectId: project.id,
              isArchived: false,
            },
            attributes: [
              "status",
              [req.models.sequelize.fn("COUNT", "*"), "count"],
            ],
            group: ["status"],
            raw: true,
          });

          const stats = taskStats.reduce(
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

          stats.total = Object.values(stats).reduce(
            (sum, count) => sum + count,
            0
          );

          return {
            ...project.toJSON(),
            taskStats: stats,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: projectsWithStats.length,
        projects: projectsWithStats,
      });
    }

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching projects",
    });
  }
});

// @desc    Get single project with details
// @route   GET /api/projects/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: [
        {
          model: Project,
          as: "subprojects",
          include: [
            {
              model: Task,
              as: "tasks",
              attributes: ["id", "status"],
              where: { isArchived: false },
              required: false,
            },
          ],
        },
        {
          model: Project,
          as: "parentProject",
          attributes: ["id", "name", "color"],
        },
        {
          model: Task,
          as: "tasks",
          where: { isArchived: false },
          required: false,
          include: [
            {
              model: Task,
              as: "subtasks",
              attributes: ["id", "title", "status"],
            },
          ],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Calculate task statistics
    const taskStats = project.tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      },
      {
        todo: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      }
    );

    const projectData = {
      ...project.toJSON(),
      taskStats,
    };

    res.status(200).json({
      success: true,
      project: projectData,
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching project",
    });
  }
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Project name is required and must be less than 100 characters"
      ),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("color")
      .optional()
      .isHexColor()
      .withMessage("Color must be a valid hex color"),
    body("parentProjectId")
      .optional()
      .isUUID()
      .withMessage("Parent project ID must be a valid UUID"),
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
        name,
        description,
        color,
        icon,
        parentProjectId,
        isFolder,
        viewSettings,
        order,
      } = req.body;

      // Validate parent project ownership if parentProjectId provided
      if (parentProjectId) {
        const parentProject = await Project.findOne({
          where: { id: parentProjectId, userId: req.user.id },
        });
        if (!parentProject) {
          return res.status(400).json({
            success: false,
            error: "Parent project not found or access denied",
          });
        }

        // Check for circular references
        let currentProject = parentProject;
        while (currentProject.parentProjectId) {
          currentProject = await Project.findByPk(
            currentProject.parentProjectId
          );
          if (!currentProject) break;
        }
      }

      // Create project
      const project = await Project.create({
        name,
        description,
        color: color || "#3B82F6", // Default blue color
        icon: icon || "folder",
        parentProjectId,
        isFolder: isFolder || false,
        viewSettings: viewSettings || {
          defaultView: "list",
          sortBy: "dueDate",
          sortOrder: "asc",
          groupBy: null,
          filters: {},
        },
        order: order || 0,
        userId: req.user.id,
      });

      // Fetch the created project with includes
      const createdProject = await Project.findByPk(project.id, {
        include: [
          {
            model: Project,
            as: "parentProject",
            attributes: ["id", "name"],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        project: createdProject,
      });
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while creating project",
      });
    }
  }
);

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Project name must be between 1 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
    body("color")
      .optional()
      .isHexColor()
      .withMessage("Color must be a valid hex color"),
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

      const project = await Project.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found",
        });
      }

      const {
        name,
        description,
        color,
        icon,
        parentProjectId,
        isFolder,
        viewSettings,
        order,
        isArchived,
      } = req.body;

      // Validate parent project ownership and prevent circular references
      if (parentProjectId && parentProjectId !== project.parentProjectId) {
        if (parentProjectId === project.id) {
          return res.status(400).json({
            success: false,
            error: "Project cannot be its own parent",
          });
        }

        const parentProject = await Project.findOne({
          where: { id: parentProjectId, userId: req.user.id },
        });
        if (!parentProject) {
          return res.status(400).json({
            success: false,
            error: "Parent project not found or access denied",
          });
        }

        // Check for circular references
        let currentProject = parentProject;
        while (currentProject.parentProjectId) {
          if (currentProject.parentProjectId === project.id) {
            return res.status(400).json({
              success: false,
              error: "Cannot create circular reference",
            });
          }
          currentProject = await Project.findByPk(
            currentProject.parentProjectId
          );
          if (!currentProject) break;
        }
      }

      // Update project
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      if (parentProjectId !== undefined)
        updateData.parentProjectId = parentProjectId;
      if (isFolder !== undefined) updateData.isFolder = isFolder;
      if (viewSettings !== undefined) updateData.viewSettings = viewSettings;
      if (order !== undefined) updateData.order = order;
      if (isArchived !== undefined) updateData.isArchived = isArchived;

      await project.update(updateData);

      // Fetch updated project with includes
      const updatedProject = await Project.findByPk(project.id, {
        include: [
          {
            model: Project,
            as: "parentProject",
            attributes: ["id", "name"],
          },
          {
            model: Project,
            as: "subprojects",
            attributes: ["id", "name", "color", "icon"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Project updated successfully",
        project: updatedProject,
      });
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while updating project",
      });
    }
  }
);

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if project has subprojects
    const subprojectCount = await Project.count({
      where: { parentProjectId: project.id },
    });

    if (subprojectCount > 0 && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete project with subprojects. Use ?force=true to delete all subprojects.",
        subprojectCount,
      });
    }

    // Check if project has tasks
    const taskCount = await Task.count({
      where: { projectId: project.id },
    });

    if (taskCount > 0 && req.query.moveTasksTo) {
      // Move tasks to another project
      const targetProject = await Project.findOne({
        where: {
          id: req.query.moveTasksTo,
          userId: req.user.id,
        },
      });

      if (!targetProject) {
        return res.status(400).json({
          success: false,
          error: "Target project not found",
        });
      }

      await Task.update(
        { projectId: targetProject.id },
        { where: { projectId: project.id } }
      );
    } else if (taskCount > 0 && req.query.orphanTasks !== "true") {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete project with tasks. Use ?orphanTasks=true to orphan tasks or ?moveTasksTo=projectId to move them.",
        taskCount,
      });
    } else if (taskCount > 0) {
      // Orphan the tasks (remove project association)
      await Task.update(
        { projectId: null },
        { where: { projectId: project.id } }
      );
    }

    // Delete subprojects if force is true
    if (subprojectCount > 0) {
      await Project.destroy({
        where: { parentProjectId: project.id },
      });
    }

    // Delete the project
    await project.destroy();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting project",
    });
  }
});

// @desc    Archive/Unarchive project
// @route   PATCH /api/projects/:id/archive
// @access  Private
router.patch("/:id/archive", async (req, res) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    await project.update({
      isArchived: !project.isArchived,
    });

    res.status(200).json({
      success: true,
      message: `Project ${project.isArchived ? "archived" : "unarchived"}`,
      project: {
        id: project.id,
        isArchived: project.isArchived,
      },
    });
  } catch (error) {
    console.error("Archive project error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while archiving project",
    });
  }
});

// @desc    Reorder projects
// @route   POST /api/projects/reorder
// @access  Private
router.post("/reorder", async (req, res) => {
  try {
    const { projectOrders } = req.body;

    if (!projectOrders || !Array.isArray(projectOrders)) {
      return res.status(400).json({
        success: false,
        error: "Project orders array is required",
      });
    }

    // Validate all projects belong to the user
    const projectIds = projectOrders.map((item) => item.projectId);
    const projects = await Project.findAll({
      where: {
        id: { [Op.in]: projectIds },
        userId: req.user.id,
      },
    });

    if (projects.length !== projectIds.length) {
      return res.status(400).json({
        success: false,
        error: "Some projects not found or access denied",
      });
    }

    // Update project orders
    const updatePromises = projectOrders.map(({ projectId, order }) =>
      Project.update(
        { order },
        { where: { id: projectId, userId: req.user.id } }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Project order updated successfully",
    });
  } catch (error) {
    console.error("Reorder projects error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while reordering projects",
    });
  }
});

// @desc    Get project hierarchy (tree structure)
// @route   GET /api/projects/hierarchy
// @access  Private
router.get("/hierarchy", async (req, res) => {
  try {
    const { includeArchived } = req.query;

    const where = {
      userId: req.user.id,
      parentProjectId: null, // Root level projects only
    };

    if (includeArchived !== "true") {
      where.isArchived = false;
    }

    const projects = await Project.findAll({
      where,
      include: [
        {
          model: Project,
          as: "subprojects",
          include: [
            {
              model: Project,
              as: "subprojects", // Nested subprojects
              include: [
                {
                  model: Project,
                  as: "subprojects", // Third level nesting
                },
              ],
            },
          ],
        },
      ],
      order: [
        ["order", "ASC"],
        ["subprojects", "order", "ASC"],
        ["subprojects", "subprojects", "order", "ASC"],
        ["subprojects", "subprojects", "subprojects", "order", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get project hierarchy error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching project hierarchy",
    });
  }
});

module.exports = router;
