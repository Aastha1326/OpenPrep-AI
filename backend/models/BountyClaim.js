const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

/**
 * BountyClaim Model
 * 
 * Captures an instance of a student successfully (or unsuccessfully) engaging
 * with a Sponsor's gamification token. 
 * Supports secure cryptographic hashing to prevent brute forcing of claim codes.
 * 
 * @class BountyClaim
 * @extends Model
 */
class BountyClaim extends Model {
    /**
     * Helper method for associations.
     * @static
     */
    static associate(models) {
        if (models.User) {
            BountyClaim.belongsTo(models.User, {
                foreignKey: 'studentUserId',
                as: 'student',
            });
        }

        if (models.Sponsor) {
            BountyClaim.belongsTo(models.Sponsor, {
                foreignKey: 'sponsorId',
                as: 'providerSponsor',
            });
        }
    }

    /**
     * Generates a securely random claim token for dropping at a career fair.
     * Format: XXXX-YYYY-ZZZZ-WWWW
     */
    static generateSecureBountyToken() {
        const bytes = crypto.randomBytes(8).toString('hex').toUpperCase();
        return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}-${bytes.slice(8, 12)}-${bytes.slice(12, 16)}`;
    }
}

/**
 * Schema Introspection
 */
function initBountyClaim(sequelize) {
    BountyClaim.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            studentUserId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Null if unassigned/not yet claimed',
            },
            sponsorId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            claimTokenHash: {
                type: DataTypes.STRING(128),
                allowNull: false,
                comment: 'SHA-256 hash of the 16 character plaintext token distributed heavily offline',
            },
            plaintextTokenMask: {
                type: DataTypes.STRING(20),
                allowNull: false,
                comment: 'e.g. XXXX-****-****-WWWW for UI rendering without exposing the real hash payload',
            },
            reputationValue: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 500,
                comment: 'Value awarded to the student upong claiming successfully',
            },
            status: {
                type: DataTypes.ENUM('ACTIVE', 'CLAIMED', 'EXPIRED', 'REVOKED'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            claimedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            expirationDate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            ipAddressRecorded: {
                type: DataTypes.STRING(128),
                allowNull: true,
                comment: 'Security tracking to prevent brute-forcing a specific token',
            },
            metadata: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: {},
                comment: 'Geolocations, event IDs, digital SWAG urls',
            }
        },
        {
            sequelize,
            modelName: 'BountyClaim',
            tableName: 'gamification_bounty_claims',
            timestamps: true,
            indexes: [
                {
                    name: 'idx_bounty_hash',
                    unique: true,
                    fields: ['claimTokenHash'],
                },
                {
                    name: 'idx_bounty_student',
                    fields: ['studentUserId'],
                },
                {
                    name: 'idx_bounty_sponsor',
                    fields: ['sponsorId'],
                }
            ],
            hooks: {
                beforeSave: (bounty, options) => {
                    if (bounty.changed('status') && bounty.status === 'CLAIMED' && !bounty.claimedAt) {
                        bounty.claimedAt = new Date();
                    }
                    if (bounty.status === 'CLAIMED' && !bounty.studentUserId) {
                        throw new Error('A claimed bounty must possess a designated studentUserId owner.');
                    }
                }
            }
        }
    );

    return BountyClaim;
}

module.exports = {
    BountyClaim,
    initBountyClaim
};
