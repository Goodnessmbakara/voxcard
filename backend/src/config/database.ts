import { Pool, PoolConfig, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This allows self-signed certificates
  }
});

// Test the connection
pool.connect((err: Error | undefined, client: PoolClient | undefined, done: (release?: any) => void) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database');
  done();
});

export default pool;