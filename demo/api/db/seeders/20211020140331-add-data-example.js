/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
// Example Seeder for Decisions tabls

// Note!...
// Dates could also be...
// createdAt: Sequelize.literal('NOW()'),
// updatedAt: Sequelize.literal('NOW()'),
// Could also put entire insert into a variable...
// 'fields' for example, and then...
// await queryInterface.bulkInsert('Decisions', fields, {});

// Could use uuid to auto-generate unique ids
// Or just use 'npx uuid' in Terminal when creating
// default data. Here's the package you would need if
// auto-generating UUIDs...
// const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Decisions', [{
      // Generating a UUID is slow.
      // Might be better to just have default data for testing
      // id: uuidv4(),
      id: '1c64451b-c756-45b4-9a51-525737d1e99b', // default data
      title: 'Test 3',
      type: 'public',
      priority: 'High',
      level: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Decisions', null, {});
  },
};
