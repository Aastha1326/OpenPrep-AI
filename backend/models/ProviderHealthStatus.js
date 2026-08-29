module.exports = (sequelize, DataTypes) => {
  const ProviderHealthStatus = sequelize.define('ProviderHealthStatus', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Provider name (e.g., gemini)',
    },
    status: {
      type: DataTypes.ENUM('healthy', 'degraded', 'unavailable'),
      allowNull: false,
      defaultValue: 'healthy',
    },
    lastCheckedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(),
    },
    consecutiveFailures: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Count of consecutive failed requests',
    },
    failureThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: 'Failures needed to mark as unavailable',
    },
    circuitBreakerOpen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Circuit breaker state for this provider',
    },
    circuitBreakerOpenedAt: {
      type: DataTypes.DATE,
      comment: 'When circuit breaker was opened',
    },
    errorRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Error rate percentage (0-100)',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    tableName: 'provider_health_status',
    timestamps: true,
  });

  return ProviderHealthStatus;
};