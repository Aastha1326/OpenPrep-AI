const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * SalaryNegotiation Model
 * Tracks turns, initial offers, user counter-offers, and market data context.
 */
class SalaryNegotiation extends Model { }

SalaryNegotiation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        targetCompany: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        roleTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        marketAverage: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        initialOffer: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'The baseline offer presented to the user'
        },
        finalOffer: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        targetSalaryGoal: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'What the user actually wants to achieve'
        },
        status: {
            type: DataTypes.ENUM('NotStarted', 'InProgress', 'Accepted', 'Withdrawn_By_User', 'Withdrawn_By_Employer'),
            defaultValue: 'NotStarted',
        },
        transcript: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of messages in the negotiation: { role, text, extractedNumber }'
        },
        turnCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        leverageScore: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            comment: '0-100 metric determining how much leverage the candidate has built'
        },
        startedAt: { type: DataTypes.DATE, allowNull: true },
        completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
        sequelize,
        modelName: 'SalaryNegotiation',
        tableName: 'salary_negotiations',
        timestamps: true,
    }
);

module.exports = SalaryNegotiation;
