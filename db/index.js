const { Sequelize,DataTypes } = require('sequelize');
const dotenv = require("dotenv");

dotenv.config(); 
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port:process.env.DB_PORT
  });

  try {
     sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  db ={};
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;
  db.users = require('../model/users.js')(sequelize,DataTypes);
  db.upload = require('../model/file.js')(sequelize,DataTypes);
  // Define relationships
db.users.hasMany(db.upload, { foreignKey: "userId", onDelete: "CASCADE" });
db.upload.belongsTo(db.users, { foreignKey: "userId" });
// db.sequelize.sync({ force: true });

  sequelize.sync();
  module.exports = db;