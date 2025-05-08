const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Decisions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Decisions.hasMany(models.Options, { foreignKey: 'decisionId' });
      // define association here
    }
  }
  Decisions.init({
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: { args: 4, msg: 'Id not valid, plese try again' },
      },
    },
    level: {
      type: DataTypes.INTEGER,
      validate: {
        len: { min: 1, max: 100, msg: 'Decision level must be between 1 and 100' },
      },
    },
    priority: {
      type: DataTypes.ENUM('High', 'Medium', 'Low'),
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Additional Business Rule!
      validate: {
        len: { args: [3, 500], msg: 'Decision Title must be between 3 and 500 characters' },
      },
    },
    type: {
      type: DataTypes.ENUM('public', 'private'),
      validate: {
        isIn: {
          args: [['public', 'private']],
          msg: 'Decisions must be public or private',
        },
      },
    },
  }, {
    sequelize,
    modelName: 'Decisions',
  });
  return Decisions;
};
