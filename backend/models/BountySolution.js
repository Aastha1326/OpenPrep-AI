const { DataTypes, Model } = require('sequelize');

class BountySolution extends Model {}

function initBountySolution(sequelize) {
  BountySolution.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bountyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      upvotesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      downvotesCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'BountySolution',
      tableName: 'bounty_solutions',
      timestamps: true,
    }
  );

  return BountySolution;
}

module.exports = {
  BountySolution,
  initBountySolution,
};
