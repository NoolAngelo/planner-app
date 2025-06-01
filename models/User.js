const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Authentication
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [1, 255],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 255],
        },
      },

      // Profile
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timezone: {
        type: DataTypes.STRING,
        defaultValue: "UTC",
        allowNull: false,
      },

      // Preferences
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          timeFormat: "24h",
          theme: "light",
          language: "en",
          weekStartDay: 1, // Monday
          workingHours: {
            start: "09:00",
            end: "17:00",
          },
          notifications: {
            email: true,
            push: true,
            desktop: true,
          },
          defaultView: "timeline",
        },
      },

      // Status
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // Token fields
      emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            user.password = await bcrypt.hash(user.password, saltRounds);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            user.password = await bcrypt.hash(user.password, saltRounds);
          }
        },
      },
    }
  );

  // Instance methods
  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.toSafeObject = function () {
    const {
      password,
      passwordResetToken,
      emailVerificationToken,
      ...safeUser
    } = this.toJSON();
    return safeUser;
  };

  // Class methods
  User.findByEmail = function (email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };

  return User;
};
