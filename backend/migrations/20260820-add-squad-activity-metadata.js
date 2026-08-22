'use strict';

/**
 * Adds the `metadata` column the squad activity service has always written to.
 *
 * The service passed `metadata` (and `description`) into `SquadActivity.create`
 * from the start, but neither existed on the model, so Sequelize dropped them
 * and the insert then failed the NOT NULL check on `message`. `message` already
 * exists; only `metadata` needs adding.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('squad_activities')) {
      return;
    }

    const columns = await queryInterface.describeTable('squad_activities');
    if (!columns.metadata) {
      await queryInterface.addColumn('squad_activities', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      });
    }
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('squad_activities')) {
      return;
    }

    const columns = await queryInterface.describeTable('squad_activities');
    if (columns.metadata) {
      await queryInterface.removeColumn('squad_activities', 'metadata');
    }
  },
};
