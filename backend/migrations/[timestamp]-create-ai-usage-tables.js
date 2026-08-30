module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create AI Usage Logs table
    await queryInterface.createTable('ai_usage_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      feature: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'gemini',
      },
      requestType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      requestCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      estimatedTokens: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('success', 'quota_exceeded', 'timeout', 'provider_error', 'retry_exhausted'),
        allowNull: false,
        defaultValue: 'success',
      },
      responseTime: {
        type: Sequelize.INTEGER,
      },
      errorMessage: {
        type: Sequelize.TEXT,
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('ai_usage_logs', ['userId', 'createdAt']);
    await queryInterface.addIndex('ai_usage_logs', ['feature', 'createdAt']);
    await queryInterface.addIndex('ai_usage_logs', ['status', 'createdAt']);

    // Create Provider Health Status table
    await queryInterface.createTable('provider_health_status', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('healthy', 'degraded', 'unavailable'),
        allowNull: false,
        defaultValue: 'healthy',
      },
      lastCheckedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      consecutiveFailures: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failureThreshold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      circuitBreakerOpen: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      circuitBreakerOpenedAt: {
        type: Sequelize.DATE,
      },
      errorRate: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('provider_health_status', ['provider']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ai_usage_logs');
    await queryInterface.dropTable('provider_health_status');
  },
};