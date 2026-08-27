const { DataTypes, Model } = require('sequelize');

class Bounty extends Model {}

function initBounty(sequelize) {
  Bounty.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'General',
      },
      bountyXP: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
        validate: {
          min: 10,
          max: 5000,
        },
      },
      status: {
        type: DataTypes.ENUM('OPEN', 'SOLVED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      winnerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      acceptedSolutionId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Bounty',
      tableName: 'bounties',
      timestamps: true,
    }
  );

  return Bounty;
}

module.exports = {
  Bounty,
  initBounty,
};
