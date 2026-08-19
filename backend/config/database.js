const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:NISHIT382424@db.eymuyrdtbinvexvaynxw.supabase.co:5432/postgres';

const sslOptions = dbUrl.includes('supabase.co') || (process.env.NODE_ENV === 'production' && !dbUrl.includes('localhost'))
  ? { require: true, rejectUnauthorized: false }
  : false;

module.exports = {
  development: {
    url: dbUrl,
    dialect: 'postgres',
    dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    logging: false,
  },
  test: {
    url: dbUrl,
    dialect: 'postgres',
    dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    logging: false,
  },
  production: {
    url: dbUrl,
    dialect: 'postgres',
    dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    logging: false,
  }
};
