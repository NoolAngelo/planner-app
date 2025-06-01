const express = require("express");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Tag, TaskTag, Task } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all tags for the authenticated user
// @route   GET /api/tags
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { includeUsage, search, sortBy, sortOrder } = req.query;

    const where = { userId: req.user.id };

    // Search filter
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    // Sorting
    const order = [];
    if (sortBy) {
      order.push([sortBy, sortOrder === "desc" ? "DESC" : "ASC"]);
    } else {
      order.push(["name", "ASC"]);
    }

    const tags = await Tag.findAll({
      where,
      order,
    });

    // Include usage statistics if requested
    if (includeUsage === "true") {
      const tagsWithUsage = await Promise.all(
        tags.map(async (tag) => {
          const usageCount = await TaskTag.count({
            where: { tagId: tag.id },
            include: [
              {
                model: Task,
                as: "task",
                where: {
                  userId: req.user.id,
                  isArchived: false,
                },
              },
            ],
          });

          return {
            ...tag.toJSON(),
            usageCount,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: tagsWithUsage.length,
        tags: tagsWithUsage,
      });
    }

    res.status(200).json({
      success: true,
      count: tags.length,
      tags,
    });
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching tags",
    });
  }
});

// @desc    Get single tag with details
// @route   GET /api/tags/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const tag = await Tag.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: "Tag not found",
      });
    }

    // Get tasks associated with this tag
    const tasks = await Task.findAll({
      include: [
        {
          model: Tag,
          as: "tags",
          where: { id: tag.id },
          through: { attributes: [] },
        },
      ],
      where: {
        userId: req.user.id,
        isArchived: false,
      },
      attributes: ["id", "title", "status", "priority", "dueDate"],
    });

    // Calculate usage statistics
    const usageStats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === "completed")
        .length,
      pendingTasks: tasks.filter((task) => task.status !== "completed").length,
      highPriorityTasks: tasks.filter((task) => task.priority === "1").length,
    };

    res.status(200).json({
      success: true,
      tag: {
        ...tag.toJSON(),
        usageStats,
        tasks,
      },
    });
  } catch (error) {
    console.error("Get tag error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching tag",
    });
  }
});

// @desc    Create new tag
// @route   POST /api/tags
// @access  Private
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Tag name is required and must be less than 50 characters"),
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

      const { name, color, description } = req.body;

      // Check if tag name already exists for this user
      const existingTag = await Tag.findOne({
        where: {
          name: name.toLowerCase(),
          userId: req.user.id,
        },
      });

      if (existingTag) {
        return res.status(400).json({
          success: false,
          error: "Tag with this name already exists",
        });
      }

      // Create tag
      const tag = await Tag.create({
        name: name.toLowerCase(),
        color: color || "#6B7280", // Default gray color
        description,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Tag created successfully",
        tag,
      });
    } catch (error) {
      console.error("Create tag error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while creating tag",
      });
    }
  }
);

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Tag name must be between 1 and 50 characters"),
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

      const tag = await Tag.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id,
        },
      });

      if (!tag) {
        return res.status(404).json({
          success: false,
          error: "Tag not found",
        });
      }

      const { name, color, description } = req.body;

      // Check if new name conflicts with existing tag
      if (name && name.toLowerCase() !== tag.name) {
        const existingTag = await Tag.findOne({
          where: {
            name: name.toLowerCase(),
            userId: req.user.id,
            id: { [Op.ne]: tag.id },
          },
        });

        if (existingTag) {
          return res.status(400).json({
            success: false,
            error: "Tag with this name already exists",
          });
        }
      }

      // Update tag
      const updateData = {};
      if (name !== undefined) updateData.name = name.toLowerCase();
      if (color !== undefined) updateData.color = color;
      if (description !== undefined) updateData.description = description;

      await tag.update(updateData);

      res.status(200).json({
        success: true,
        message: "Tag updated successfully",
        tag,
      });
    } catch (error) {
      console.error("Update tag error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while updating tag",
      });
    }
  }
);

// @desc    Delete tag
// @route   DELETE /api/tags/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const tag = await Tag.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: "Tag not found",
      });
    }

    // Check if tag is being used
    const usageCount = await TaskTag.count({
      where: { tagId: tag.id },
    });

    if (usageCount > 0 && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete tag that is in use. Use ?force=true to remove from all tasks.",
        usageCount,
      });
    }

    // Remove tag from all tasks if force is true
    if (usageCount > 0) {
      await TaskTag.destroy({
        where: { tagId: tag.id },
      });
    }

    // Delete the tag
    await tag.destroy();

    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Delete tag error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting tag",
    });
  }
});

// @desc    Get tag usage statistics
// @route   GET /api/tags/stats
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    // Total tags
    const totalTags = await Tag.count({
      where: { userId: req.user.id },
    });

    // Most used tags
    const mostUsedTags = await Tag.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: TaskTag,
          as: "taskTags",
          include: [
            {
              model: Task,
              as: "task",
              where: {
                userId: req.user.id,
                isArchived: false,
              },
              attributes: [],
            },
          ],
        },
      ],
      attributes: [
        "id",
        "name",
        "color",
        [
          req.models.sequelize.fn(
            "COUNT",
            req.models.sequelize.col("taskTags.id")
          ),
          "usageCount",
        ],
      ],
      group: ["Tag.id"],
      order: [[req.models.sequelize.literal("usageCount"), "DESC"]],
      limit: 10,
      subQuery: false,
    });

    // Unused tags
    const unusedTags = await Tag.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: TaskTag,
          as: "taskTags",
          required: false,
        },
      ],
      having: req.models.sequelize.where(
        req.models.sequelize.fn(
          "COUNT",
          req.models.sequelize.col("taskTags.id")
        ),
        0
      ),
      group: ["Tag.id"],
      attributes: ["id", "name", "color", "createdAt"],
    });

    // Color distribution
    const colorStats = await Tag.findAll({
      where: { userId: req.user.id },
      attributes: ["color", [req.models.sequelize.fn("COUNT", "*"), "count"]],
      group: ["color"],
      order: [[req.models.sequelize.literal("count"), "DESC"]],
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalTags,
        mostUsed: mostUsedTags,
        unused: unusedTags.length,
        unusedTags: unusedTags,
        colorDistribution: colorStats,
      },
    });
  } catch (error) {
    console.error("Get tag stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching tag statistics",
    });
  }
});

// @desc    Merge tags
// @route   POST /api/tags/merge
// @access  Private
router.post("/merge", async (req, res) => {
  try {
    const { sourceTagIds, targetTagId } = req.body;

    if (!sourceTagIds || !Array.isArray(sourceTagIds) || !targetTagId) {
      return res.status(400).json({
        success: false,
        error: "Source tag IDs array and target tag ID are required",
      });
    }

    // Verify all tags belong to the user
    const allTagIds = [...sourceTagIds, targetTagId];
    const tags = await Tag.findAll({
      where: {
        id: { [Op.in]: allTagIds },
        userId: req.user.id,
      },
    });

    if (tags.length !== allTagIds.length) {
      return res.status(400).json({
        success: false,
        error: "Some tags not found or access denied",
      });
    }

    const targetTag = tags.find((tag) => tag.id === targetTagId);
    if (!targetTag) {
      return res.status(400).json({
        success: false,
        error: "Target tag not found",
      });
    }

    // Get all task associations for source tags
    const taskTags = await TaskTag.findAll({
      where: { tagId: { [Op.in]: sourceTagIds } },
      include: [
        {
          model: Task,
          as: "task",
          where: { userId: req.user.id },
        },
      ],
    });

    // Transfer all associations to target tag
    const transferPromises = taskTags.map(async (taskTag) => {
      // Check if target tag is already associated with this task
      const existing = await TaskTag.findOne({
        where: {
          taskId: taskTag.taskId,
          tagId: targetTagId,
        },
      });

      if (!existing) {
        await TaskTag.create({
          taskId: taskTag.taskId,
          tagId: targetTagId,
        });
      }

      // Remove old association
      await taskTag.destroy();
    });

    await Promise.all(transferPromises);

    // Delete source tags
    await Tag.destroy({
      where: {
        id: { [Op.in]: sourceTagIds },
        userId: req.user.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Tags merged successfully",
      targetTag,
      mergedCount: sourceTagIds.length,
    });
  } catch (error) {
    console.error("Merge tags error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while merging tags",
    });
  }
});

// @desc    Bulk create tags
// @route   POST /api/tags/bulk
// @access  Private
router.post("/bulk", async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: "Tags array is required",
      });
    }

    // Validate each tag
    const validTags = [];
    const errors = [];

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];

      if (!tag.name || tag.name.trim().length === 0) {
        errors.push(`Tag ${i + 1}: Name is required`);
        continue;
      }

      if (tag.name.length > 50) {
        errors.push(`Tag ${i + 1}: Name must be less than 50 characters`);
        continue;
      }

      if (tag.color && !/^#[0-9A-Fa-f]{6}$/.test(tag.color)) {
        errors.push(`Tag ${i + 1}: Invalid hex color`);
        continue;
      }

      // Check for duplicates in the current batch
      const duplicate = validTags.find(
        (t) => t.name.toLowerCase() === tag.name.toLowerCase()
      );
      if (duplicate) {
        errors.push(`Tag ${i + 1}: Duplicate name in batch`);
        continue;
      }

      // Check if tag already exists for user
      const existing = await Tag.findOne({
        where: {
          name: tag.name.toLowerCase(),
          userId: req.user.id,
        },
      });

      if (existing) {
        errors.push(`Tag ${i + 1}: Tag "${tag.name}" already exists`);
        continue;
      }

      validTags.push({
        name: tag.name.toLowerCase(),
        color: tag.color || "#6B7280",
        description: tag.description || null,
        userId: req.user.id,
      });
    }

    if (errors.length > 0 && validTags.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    // Create valid tags
    const createdTags = await Tag.bulkCreate(validTags);

    res.status(201).json({
      success: true,
      message: `${createdTags.length} tags created successfully`,
      tags: createdTags,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk create tags error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while creating tags",
    });
  }
});

module.exports = router;
