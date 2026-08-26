/**
 * Migration: 003_create_audit_logs
 * Description: Creates immutable audit logging table for security and pool lifecycle telemetry
 */

exports.up = (pgm) => {
  pgm.createTable('audit_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    event_type: { type: 'varchar(100)', notNull: true },
    severity: { type: 'varchar(20)', notNull: true, default: 'INFO' },
    actor_id: { type: 'uuid', allowNull: true },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    ip_address: { type: 'varchar(45)', allowNull: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('audit_logs', 'event_type');
  pgm.createIndex('audit_logs', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('audit_logs', { ifExists: true, cascade: true });
};
