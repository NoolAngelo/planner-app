module.exports = (sequelize, DataTypes) => {
  const TaskTag = sequelize.define(
    "TaskTag",
    {
      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
      },
      tagId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tags",
          key: "id",
        },
      },
    },
    {
      tableName: "task_tags",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["taskId", "tagId"],
        },
      ],
    }
  );

  return TaskTag;
};
