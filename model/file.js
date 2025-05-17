module.exports = (sequelize, DataTypes) => {
  const Upload = sequelize.define(
    "Upload",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID, // Matches User.id type
        allowNull: false,
        references: {
          model: "Users", // Correct table name
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "Uploads", // Ensure correct table name
      timestamps: false,
    }
  );

  return Upload;
};
