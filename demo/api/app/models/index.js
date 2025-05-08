/* eslint-disable */
// Note!
// Disabling eslint for this default index file. 
// Sequelize generates this code when using 'npx sequelize init --force'
// Remember! ...The force option will remove any existing models and 
// just add this default index file to the models folder. 
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// If you wanted to make this ESLint friendly, remove: __dirname +
// Notice how 'env' is being used to ONLY refer to that section of the config file.
// If the NODE_ENV environment variable hasn't been set, it will default to development.   
const config = require(`${__dirname}/../../db/config.json`)[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// ESLint has an issue with dynamic paths, so __dirname would
// also cause ESLint to flag the code below... 
fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
