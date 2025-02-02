'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Restaurants', 'view_count', {
      alowNull: false,
      defaultValue: 0,
      type: Sequelize.INTEGER.UNSIGNED
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Restaurants', 'view_count')
  }
}
