const { Sequelize } = require("sequelize");
const config = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions || {},
  }
);

// Import models
const User = require("./User")(sequelize, Sequelize.DataTypes);
const Project = require("./Project")(sequelize, Sequelize.DataTypes);
const Task = require("./Task")(sequelize, Sequelize.DataTypes);
const Tag = require("./Tag")(sequelize, Sequelize.DataTypes);
const TaskTag = require("./TaskTag")(sequelize, Sequelize.DataTypes);
const Comment = require("./Comment")(sequelize, Sequelize.DataTypes);
const Attachment = require("./Attachment")(sequelize, Sequelize.DataTypes);

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Project, { foreignKey: "ownerId", as: "ownedProjects" });
  User.hasMany(Task, { foreignKey: "userId", as: "tasks" });
  User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
  User.hasMany(Tag, { foreignKey: "userId", as: "tags" });

  // Project associations
  Project.belongsTo(User, { foreignKey: "ownerId", as: "owner" });
  Project.hasMany(Task, { foreignKey: "projectId", as: "tasks" });
  Project.belongsTo(Project, { foreignKey: "parentId", as: "parent" });
  Project.hasMany(Project, { foreignKey: "parentId", as: "children" });

  // Task associations
  Task.belongsTo(User, { foreignKey: "userId", as: "user" });
  Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });
  Task.belongsTo(Task, { foreignKey: "parentTaskId", as: "parentTask" });
  Task.hasMany(Task, { foreignKey: "parentTaskId", as: "subtasks" });
  Task.hasMany(Comment, { foreignKey: "taskId", as: "comments" });
  Task.hasMany(Attachment, { foreignKey: "taskId", as: "attachments" });

  // Tag associations (Many-to-Many with Tasks)
  Tag.belongsTo(User, { foreignKey: "userId", as: "user" });
  Task.belongsToMany(Tag, {
    through: TaskTag,
    foreignKey: "taskId",
    as: "tags",
  });
  Tag.belongsToMany(Task, {
    through: TaskTag,
    foreignKey: "tagId",
    as: "tasks",
  });

  // Comment associations
  Comment.belongsTo(User, { foreignKey: "userId", as: "user" });
  Comment.belongsTo(Task, { foreignKey: "taskId", as: "task" });

  // Attachment associations
  Attachment.belongsTo(Task, { foreignKey: "taskId", as: "task" });
};

defineAssociations();

module.exports = {
  sequelize,
  Sequelize,
  User,
  Project,
  Task,
  Tag,
  TaskTag,
  Comment,
  Attachment,
};
