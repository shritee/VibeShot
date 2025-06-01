module.exports = (sequelize, DataTypes) => {
  const Followers = sequelize.define(
    "Followers",
    {
      followerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      followingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      tableName: "Followers",
      timestamps: false,
    }
  );

  return Followers;
};
