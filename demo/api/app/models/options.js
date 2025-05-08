const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Options extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Options.belongsTo(models.Decisions, { foreignKey: 'decisionsId' });
    }
  }
  Options.init({
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: { args: 4, msg: 'Id not valid, please try again' },
      },
    },
    value: {
      type: DataTypes.STRING,
      validate: {
        len: { args: [3, 500], msg: 'Option value is required' },
      },
    },
  }, {
    sequelize,
    modelName: 'Options',
  });
  return Options;
};
