
module.exports = (sequelize,DataTypes)=>{
    const User = sequelize.define(
        'User',
        {
          // Model attributes are defined here
           id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          email: {
              type: DataTypes.STRING,
              allowNull: false,
              validate: {
                isEmail: true
              }
          },
          display_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          username: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          dob:{
              type: DataTypes.STRING,
              allowNull: false,
          }
        },{
          tableName : "User"
        }
      );
    return User  
}