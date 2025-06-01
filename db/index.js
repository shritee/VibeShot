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
  db.followers = require('../model/followers.js')(sequelize,DataTypes);
  db.posts = require('../model/posts.js')(sequelize,DataTypes);
  db.likes = require('../model/like.js')(sequelize, DataTypes);
db.comments = require('../model/comment.js')(sequelize, DataTypes);
db.savedPosts = require('../model/savedposts.js')(sequelize, DataTypes);

  // Define relationships
db.users.hasMany(db.upload, { foreignKey: "userId", onDelete: "CASCADE",as: 'uploads' });
db.upload.belongsTo(db.users, { foreignKey: "userId",as: 'user' });
// db.followers.belongsTo(db.users, { foreignKey: "userId",as: 'user' });
db.posts.belongsTo(db.users, { foreignKey: "userId",as: 'user' });
// Relationships
db.posts.hasMany(db.likes, { foreignKey: "postId", onDelete: "CASCADE", as: "likes" });
db.likes.belongsTo(db.posts, { foreignKey: "postId", as: "post" });
db.likes.belongsTo(db.users, { foreignKey: "userId", as: "user" });

db.posts.hasMany(db.comments, { foreignKey: "postId", onDelete: "CASCADE", as: "comments" });
db.comments.belongsTo(db.posts, { foreignKey: "postId", as: "post" });
db.comments.belongsTo(db.users, { foreignKey: "userId", as: "user" });

db.posts.hasMany(db.savedPosts, { foreignKey: "postId", onDelete: "CASCADE", as: "savedPosts" });
db.savedPosts.belongsTo(db.posts, { foreignKey: "postId", as: "post" });
db.savedPosts.belongsTo(db.users, { foreignKey: "userId", as: "user" });
// Users following other users (followers relationship)
db.users.belongsToMany(db.users, {
  through: db.followers,
  as: 'Following',
  foreignKey: 'followerId',
  otherKey: 'followingId',
});

db.users.belongsToMany(db.users, {
  through: db.followers,
  as: 'Followersme',
  foreignKey: 'followingId',
  otherKey: 'followerId',
});

// db.sequelize.sync({ force: true });

  sequelize.sync();
  module.exports = db;