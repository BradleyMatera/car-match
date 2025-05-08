const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EX1 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }
  }
  EX1.init({
    title: DataTypes.STRING,
    type: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'EX1',
  });
  return EX1;
};
