const { Model, DataTypes } = require('sequelize');

/**
 * JobOpportunity Model
 * 
 * Represents a discrete opening at a corporation tracked on the platform.
 * Supports metadata parsing for external scrapers and rich embedding for
 * AI resume match scoring. Central source of truth for the company node.
 * 
 * @class JobOpportunity
 * @extends Model
 */
class JobOpportunity extends Model {
    /**
     * Helper method for defining associations.
     * @static
     */
    static associate(models) {
        if (models.Company) {
            JobOpportunity.belongsTo(models.Company, {
                foreignKey: 'companyId',
                as: 'company',
            });
        }

        if (models.JobApplication) {
            JobOpportunity.hasMany(models.JobApplication, {
                foreignKey: 'jobOpportunityId',
                as: 'applications',
                onDelete: 'CASCADE', // If the global job is removed, delete all trackings
            });
        }

        if (models.Tag) {
            // e.g., "Remote", "High Priority", "Python"
            JobOpportunity.belongsToMany(models.Tag, {
                through: 'job_opportunity_tags',
                as: 'tags',
                foreignKey: 'jobOpportunityId',
            });
        }
    }
}

/**
 * Strict schema initialization with indices for enterprise search
 */
function initJobOpportunity(sequelize) {
    JobOpportunity.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            companyId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Foreign key to normalized Company model if it exists',
            },
            externalCompanyString: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: 'Company string if manually provided by student (not in canonical DB)',
            },
            roleTitle: {
                type: DataTypes.STRING(255),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [3, 200]
                }
            },
            workModel: {
                type: DataTypes.ENUM('ON_SITE', 'HYBRID', 'REMOTE', 'UNKNOWN'),
                allowNull: false,
                defaultValue: 'UNKNOWN',
            },
            employmentType: {
                type: DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'),
                allowNull: false,
                defaultValue: 'FULL_TIME',
            },
            salaryRangeMin: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: { min: 0 }
            },
            salaryRangeMax: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: { min: 0 }
            },
            salaryCurrency: {
                type: DataTypes.STRING(3),
                allowNull: false,
                defaultValue: 'USD',
            },
            locationCity: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            locationState: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            locationCountry: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            externalUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                validate: {
                    isUrl: true,
                },
                comment: 'Direct URL to the greenhouse/lever application page',
            },
            rawDescription: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Raw scraped or copy-pasted textual description for NLP ingestion',
            },
            parsedRequirements: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: [],
                comment: 'Array of strings detected via AI mapping to standard skills',
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Flagged false if the listing has been explicitly closed or expired',
            },
            datePosted: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            dateDeadline: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            aiMatchScoreGlobal: {
                type: DataTypes.FLOAT,
                allowNull: true,
                validate: { min: 0, max: 1 },
                comment: 'Pre-computed heuristic for global match against local population pool. Overwritten locally.',
            }
        },
        {
            sequelize,
            modelName: 'JobOpportunity',
            tableName: 'job_opportunities',
            timestamps: true,
            indexes: [
                {
                    name: 'idx_job_opp_role_title_trgm',
                    fields: ['roleTitle'],
                    // In actual PG environment this would be using GIN and pg_trgm for partial string search
                },
                {
                    name: 'idx_job_opp_company',
                    fields: ['companyId'],
                },
                {
                    name: 'idx_job_opp_status',
                    fields: ['isActive', 'createdAt'],
                }
            ],
            hooks: {
                beforeCreate: async (job, options) => {
                    if (job.salaryRangeMin && job.salaryRangeMax && job.salaryRangeMin > job.salaryRangeMax) {
                        throw new Error('Minimum salary cannot exceed maximum salary.');
                    }
                    // Normalize capitalization on location strings
                    if (job.locationCity) {
                        job.locationCity = job.locationCity.charAt(0).toUpperCase() + job.locationCity.slice(1).toLowerCase();
                    }
                },
                beforeUpdate: async (job, options) => {
                    if (job.salaryRangeMin && job.salaryRangeMax && job.salaryRangeMin > job.salaryRangeMax) {
                        throw new Error('Minimum salary cannot exceed maximum salary.');
                    }
                }
            }
        }
    );

    return JobOpportunity;
}

module.exports = {
    JobOpportunity,
    initJobOpportunity
};
