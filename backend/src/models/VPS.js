const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('VPS', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'creating',
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sshPassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
};
