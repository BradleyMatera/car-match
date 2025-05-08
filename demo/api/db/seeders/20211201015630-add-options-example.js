/* eslint-disable no-unused-vars */
// Example Seeder for Options table
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
    await queryInterface.bulkInsert('Options', [{
      // Let's create some fake options...
      id: '2a15dfaa-a9b6-4b89-aec5-de8822a207a4',
      value: 'JavaScript',
      descisionId: '1c64451b-c756-45b4-9a51-525737d1e99b',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, {
      id: '07c7e176-bcdc-4ed4-9d97-cb13a991fdbb',
      value: 'CSS',
      descisionId: '1c64451b-c756-45b4-9a51-525737d1e99b',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, {
      id: '44cf24e3-db82-4831-9330-e65fd91f6f25',
      value: 'HTML',
      descisionId: '1c64451b-c756-45b4-9a51-525737d1e99b',
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
