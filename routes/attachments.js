const express = require("express");
const { body, validationResult } = require("express-validator");
const { Attachment, Task } = require("../models");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get attachments for a task
// @route   GET /api/attachments/task/:taskId
// @access  Private
router.get("/task/:taskId", async (req, res) => {
  try {
    // Verify task ownership
    const task = await Task.findOne({
      where: {
        id: req.params.taskId,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or access denied",
      });
    }

    const attachments = await Attachment.findAll({
      where: { taskId: req.params.taskId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: attachments.length,
      attachments,
    });
  } catch (error) {
    console.error("Get attachments error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching attachments",
    });
  }
});

// @desc    Get single attachment
// @route   GET /api/attachments/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const attachment = await Attachment.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Task,
          as: "task",
          where: { userId: req.user.id },
          attributes: ["id", "title"],
        },
      ],
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Attachment not found or access denied",
      });
    }

    res.status(200).json({
      success: true,
      attachment,
    });
  } catch (error) {
    console.error("Get attachment error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching attachment",
    });
  }
});

// @desc    Create new attachment (upload placeholder)
// @route   POST /api/attachments
// @access  Private
router.post(
  "/",
  [
    body("taskId").isUUID().withMessage("Valid task ID is required"),
    body("filename")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Filename is required and must be less than 255 characters"),
    body("originalName")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Original name is required"),
    body("mimeType")
      .trim()
      .isLength({ min: 1 })
      .withMessage("MIME type is required"),
    body("size")
      .isInt({ min: 1 })
      .withMessage("File size must be a positive integer"),
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

      const { taskId, filename, originalName, mimeType, size, path, url } =
        req.body;

      // Verify task ownership
      const task = await Task.findOne({
        where: {
          id: taskId,
          userId: req.user.id,
        },
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found or access denied",
        });
      }

      // Validate file size (10MB limit for now)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (size > maxSize) {
        return res.status(400).json({
          success: false,
          error: "File size exceeds 10MB limit",
        });
      }

      // Create attachment record
      const attachment = await Attachment.create({
        taskId,
        filename,
        originalName,
        mimeType,
        size,
        path: path || `/uploads/${filename}`,
        url: url || `/api/attachments/${filename}/download`,
        uploadedBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Attachment created successfully",
        attachment,
      });
    } catch (error) {
      console.error("Create attachment error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while creating attachment",
      });
    }
  }
);

// @desc    Update attachment metadata
// @route   PUT /api/attachments/:id
// @access  Private
router.put(
  "/:id",
  [
    body("originalName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Original name must be between 1 and 255 characters"),
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

      const attachment = await Attachment.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: Task,
            as: "task",
            where: { userId: req.user.id },
            attributes: ["id"],
          },
        ],
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: "Attachment not found or access denied",
        });
      }

      const { originalName } = req.body;

      // Update attachment
      const updateData = {};
      if (originalName !== undefined) updateData.originalName = originalName;

      await attachment.update(updateData);

      res.status(200).json({
        success: true,
        message: "Attachment updated successfully",
        attachment,
      });
    } catch (error) {
      console.error("Update attachment error:", error);
      res.status(500).json({
        success: false,
        error: "Server error while updating attachment",
      });
    }
  }
);

// @desc    Delete attachment
// @route   DELETE /api/attachments/:id
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const attachment = await Attachment.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Task,
          as: "task",
          where: { userId: req.user.id },
          attributes: ["id"],
        },
      ],
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Attachment not found or access denied",
      });
    }

    // TODO: Delete actual file from storage
    // For now, just delete the database record
    await attachment.destroy();

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Delete attachment error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while deleting attachment",
    });
  }
});

// @desc    Download attachment (placeholder)
// @route   GET /api/attachments/:filename/download
// @access  Private
router.get("/:filename/download", async (req, res) => {
  try {
    const attachment = await Attachment.findOne({
      where: { filename: req.params.filename },
      include: [
        {
          model: Task,
          as: "task",
          where: { userId: req.user.id },
          attributes: ["id"],
        },
      ],
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Attachment not found or access denied",
      });
    }

    // TODO: Implement actual file serving
    // For now, return attachment metadata
    res.status(501).json({
      success: false,
      message: "File download not yet implemented",
      attachment: {
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
      },
      todo: "Implement file storage and serving (S3, local filesystem, etc.)",
    });
  } catch (error) {
    console.error("Download attachment error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while downloading attachment",
    });
  }
});

// @desc    Get attachment statistics
// @route   GET /api/attachments/stats
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    // Get user's tasks for filtering
    const userTasks = await Task.findAll({
      where: { userId: req.user.id },
      attributes: ["id"],
    });

    const taskIds = userTasks.map((task) => task.id);

    if (taskIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalAttachments: 0,
          totalSize: 0,
          averageSize: 0,
          fileTypes: {},
          recentUploads: 0,
        },
      });
    }

    // Total attachments and size
    const totalStats = await Attachment.findAll({
      where: { taskId: { [req.models.Sequelize.Op.in]: taskIds } },
      attributes: [
        [req.models.sequelize.fn("COUNT", "*"), "totalAttachments"],
        [
          req.models.sequelize.fn("SUM", req.models.sequelize.col("size")),
          "totalSize",
        ],
        [
          req.models.sequelize.fn("AVG", req.models.sequelize.col("size")),
          "averageSize",
        ],
      ],
      raw: true,
    });

    // File type distribution
    const fileTypes = await Attachment.findAll({
      where: { taskId: { [req.models.Sequelize.Op.in]: taskIds } },
      attributes: [
        "mimeType",
        [req.models.sequelize.fn("COUNT", "*"), "count"],
      ],
      group: ["mimeType"],
      order: [[req.models.sequelize.literal("count"), "DESC"]],
      raw: true,
    });

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = await Attachment.count({
      where: {
        taskId: { [req.models.Sequelize.Op.in]: taskIds },
        createdAt: { [req.models.Sequelize.Op.gte]: sevenDaysAgo },
      },
    });

    const stats = totalStats[0] || {};
    const fileTypeStats = fileTypes.reduce((acc, type) => {
      acc[type.mimeType] = parseInt(type.count);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      stats: {
        totalAttachments: parseInt(stats.totalAttachments) || 0,
        totalSize: parseInt(stats.totalSize) || 0,
        averageSize: Math.round(parseFloat(stats.averageSize)) || 0,
        fileTypes: fileTypeStats,
        recentUploads,
      },
    });
  } catch (error) {
    console.error("Get attachment stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching attachment statistics",
    });
  }
});

module.exports = router;
