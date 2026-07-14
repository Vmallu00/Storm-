const { Sequelize } = require('sequelize');
const UserModel = require('./User');
const VPSModel = require('./VPS');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const User = UserModel(sequelize);
const VPS = VPSModel(sequelize);

User.hasMany(VPS, { foreignKey: 'userId' });
VPS.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, VPS };
