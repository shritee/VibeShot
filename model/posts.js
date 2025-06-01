module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      caption: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Posts",
      timestamps: false,
    }
  );

  Post.associate = (models) => {
    Post.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    Post.hasMany(models.Like, {
      foreignKey: "postId",
      as: "likes",
      onDelete: "CASCADE",
    });

    Post.hasMany(models.Comment, {
      foreignKey: "postId",
      as: "comments",
      onDelete: "CASCADE",
    });

    Post.hasMany(models.SavedPost, {
      foreignKey: "postId",
      as: "savedPosts",
      onDelete: "CASCADE",
    });
  };

  return Post;
};
