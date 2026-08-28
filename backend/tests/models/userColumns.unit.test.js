import { describe, it, expect } from 'vitest';
const fs = require('fs');
const path = require('path');

const User = require('../../models/User');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

/**
 * Every column any migration adds to the Users table via addColumn.
 *
 * A column that exists in Postgres but not in User.rawAttributes is invisible
 * to Sequelize: reads never hydrate it and `User.update()` drops it from the
 * SET clause without raising anything. That is exactly how the comment flag
 * pipeline shipped writing `isShadowBanned: true` to no effect.
 */
function columnsAddedToUsers() {
  const added = new Set();

  for (const file of fs.readdirSync(MIGRATIONS_DIR)) {
    if (!file.endsWith('.js')) continue;
    const source = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    for (const match of source.matchAll(/addColumn\(\s*'Users'\s*,\s*'([^']+)'/g)) {
      added.add(match[1]);
    }
  }

  return [...added];
}

describe('User Model Column Constraints', () => {
  it('should have exactly one leaderboardVisible definition with correct constraints', () => {
    const attribute = User.rawAttributes.leaderboardVisible;
    expect(attribute).toBeDefined();
    expect(attribute.type.constructor.name).toBe('BOOLEAN');
    expect(attribute.defaultValue).toBe(true);
  });

  it('should have exactly one receiveWeeklyDigest definition with allowNull: false', () => {
    const attribute = User.rawAttributes.receiveWeeklyDigest;
    expect(attribute).toBeDefined();
    expect(attribute.type.constructor.name).toBe('BOOLEAN');
    expect(attribute.defaultValue).toBe(true);
    expect(attribute.allowNull).toBe(false);
  });
});

describe('User model matches the Users table migrations build', () => {
  it('declares an attribute for every column a migration adds', () => {
    const undeclared = columnsAddedToUsers().filter((column) => !User.rawAttributes[column]);

    // Sequelize silently ignores an undeclared attribute on write, so this
    // gap does not surface as an error anywhere at runtime.
    expect(undeclared).toEqual([]);
  });

  it('finds the columns it is supposed to be checking', () => {
    // Guards the guard: a regex that matched nothing would pass vacuously.
    expect(columnsAddedToUsers().length).toBeGreaterThan(0);
  });

  it('declares isShadowBanned so the flag pipeline can persist a ban', () => {
    const attribute = User.rawAttributes.isShadowBanned;

    expect(attribute).toBeDefined();
    expect(attribute.type.constructor.name).toBe('BOOLEAN');
    expect(attribute.allowNull).toBe(false);
    expect(attribute.defaultValue).toBe(false);
  });

  it('builds a SET clause that includes isShadowBanned', () => {
    // The shape of the original bug: an undeclared key never reaches the SQL.
    const queryGenerator = User.sequelize.getQueryInterface().queryGenerator;
    const sql = queryGenerator.updateQuery(
      User.getTableName(),
      { isShadowBanned: true },
      { id: 'some-user-id' },
      { model: User }
    );

    expect(String(sql.query || sql)).toContain('isShadowBanned');
  });
});
