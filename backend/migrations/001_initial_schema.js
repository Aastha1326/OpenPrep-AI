/**
 * Migration: 001_initial_schema
 * Description: Initializes foundational schema tables and migration metadata tracking
 */

exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('schema_migrations_meta', {
    id: { type: 'serial', primaryKey: true },
    version: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    applied_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    execution_time_ms: { type: 'integer', notNull: true, default: 0 },
    checksum: { type: 'varchar(64)', notNull: true, default: '' },
  });

  pgm.createIndex('schema_migrations_meta', 'version');
};

exports.down = (pgm) => {
  pgm.dropTable('schema_migrations_meta', { ifExists: true, cascade: true });
};
