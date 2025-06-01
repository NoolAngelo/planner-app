module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define(
    "Attachment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
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
      tableName: "attachments",
      timestamps: true,
      indexes: [
        {
          fields: ["taskId"],
        },
      ],
    }
  );

  return Attachment;
};
