// In this example, Sequelize is being used with literal('NOW()')
// For date. literal could be used for other items as well.
// The sequelize.literal utility function, allows us to directly
// insert arbitrary content into the query without any automatic escaping.
// This means that Sequelize can help you with other parts of code,
// but we still have the ability to write raw postgresSQL ourselves.

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      'Users',
      [
        {
          avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
          city: 'Los Angeles',
          id: '56e1790c-6315-4e14-81bf-e1057d71a515',
          password: '1234',
          state: 'California',
          username: 'friendOfDev',
          createdAt: Sequelize.literal('NOW()'),
          updatedAt: Sequelize.literal('NOW()'),
        },
        {
          avatar: 'https://randomuser.me/api/portraits/men/20.jpg',
          city: 'New York',
          id: 'eeb083a4-c084-48b2-9927-10180e8f3d3c',
          password: '1234',
          state: 'New York',
          username: 'designAndDev',
          createdAt: Sequelize.literal('NOW()'),
          updatedAt: Sequelize.literal('NOW()'),
        },
      ],
      {},
    );
  },

  // eslint-disable-next-line no-unused-vars
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
