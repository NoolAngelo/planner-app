module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 2000],
        },
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },

      taskId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "tasks",
          key: "id",
        },
      },
    },
    {
      tableName: "comments",
      timestamps: true,
      indexes: [
        {
          fields: ["taskId"],
        },
        {
          fields: ["userId"],
        },
      ],
    }
  );

  return Comment;
};
