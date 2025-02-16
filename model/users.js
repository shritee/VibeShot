
module.exports = (sequelize,DataTypes)=>{
    const User = sequelize.define(
        'User',
        {
          // Model attributes are defined here
          email: {
              type: DataTypes.STRING,
              allowNull: false,
              validate: {
                  is: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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