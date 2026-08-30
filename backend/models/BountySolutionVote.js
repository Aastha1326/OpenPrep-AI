const { DataTypes, Model } = require('sequelize');

class BountySolutionVote extends Model {}

function initBountySolutionVote(sequelize) {
  BountySolutionVote.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      solutionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      voteType: {
        type: DataTypes.ENUM('UP', 'DOWN'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'BountySolutionVote',
      tableName: 'bounty_solution_votes',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['solutionId', 'userId'],
        },
      ],
    }
  );

  return BountySolutionVote;
}

module.exports = {
  BountySolutionVote,
  initBountySolutionVote,
};
