module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    "Tag",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: "#6366f1",
        validate: {
          is: /^#[0-9A-F]{6}$/i,
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
    },
    {
      tableName: "tags",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["name", "userId"],
        },
      ],
    }
  );

  return Tag;
};
