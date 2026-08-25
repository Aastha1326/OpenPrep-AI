const { Model, DataTypes } = require('sequelize');

/**
 * Sponsor Model
 * 
 * Represents an enterprise sponsor partnering with OpenPrep-AI.
 * Supplements traditional Company models by maintaining gamification parameters,
 * budget limits for bounty drops, and custom branding for the student HUD.
 * 
 * @class Sponsor
 * @extends Model
 */
class Sponsor extends Model {
    /**
     * Helper method for defining associations.
     * @static
     */
    static associate(models) {
        if (models.Company) {
            Sponsor.belongsTo(models.Company, {
                foreignKey: 'companyId',
                as: 'parentCompany',
            });
        }

        if (models.BountyClaim) {
            Sponsor.hasMany(models.BountyClaim, {
                foreignKey: 'sponsorId',
                as: 'claims',
            });
        }

        if (models.User) {
            // The representative managing the sponsor dashboard
            Sponsor.belongsTo(models.User, {
                foreignKey: 'representativeId',
                as: 'managingRepresentative'
            });
        }
    }

    /**
     * Verify if the sponsor has enough budget to drop a new bounty code
     */
    hasBudget(cost) {
        return (this.totalBudgetAllocated - this.totalBudgetSpent) >= cost;
    }
}

/**
 * Schema Initialization
 */
function initSponsor(sequelize) {
    Sponsor.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            companyId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Canonical reference to the core Company node',
            },
            representativeId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'User ID of the corporate recruiter or marketing agent',
            },
            sponsorTier: {
                type: DataTypes.ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'TITANIUM'),
                allowNull: false,
                defaultValue: 'BRONZE',
            },
            brandColorHex: {
                type: DataTypes.STRING(7), // e.g. #FF5733
                allowNull: true,
                validate: {
                    is: /^#[0-9A-F]{6}$/i
                }
            },
            customLogoUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: { isUrl: true }
            },
            totalBudgetAllocated: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Maximum reputation/dollar points allowed to distribute',
            },
            totalBudgetSpent: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            activeBountyCodesCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            gamificationEnabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            sponsorMessage: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Custom message displayed when a student successfully claims a bounty',
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            }
        },
        {
            sequelize,
            modelName: 'Sponsor',
            tableName: 'sponsors',
            timestamps: true,
            paranoid: true, // Soft-removals to preserve accounting history
            indexes: [
                {
                    name: 'idx_sponsor_company',
                    fields: ['companyId'],
                },
                {
                    name: 'idx_sponsor_tier',
                    fields: ['sponsorTier'],
                }
            ],
            hooks: {
                beforeSave: (sponsor, options) => {
                    if (sponsor.totalBudgetSpent > sponsor.totalBudgetAllocated) {
                        throw new Error('Sponsor budget has been catastrophically overdrawn. Manual audit required.');
                    }
                    if (sponsor.brandColorHex) {
                        sponsor.brandColorHex = sponsor.brandColorHex.toUpperCase();
                    }
                }
            }
        }
    );

    return Sponsor;
}

module.exports = {
    Sponsor,
    initSponsor
};
