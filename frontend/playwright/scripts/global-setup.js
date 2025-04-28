import { startDocker } from './docker-control.js';
import { Pool } from 'pg';

export async function seedDatabase() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'attendify',
    password: 'password',
    port: 5432,
  });

  try {
    // Clear table and reset ID sequence
    await pool.query(`
      DELETE FROM events;
      ALTER SEQUENCE events_id_seq RESTART WITH 1;
      INSERT INTO events (name, date_time, location, total_participants, status, additional_info)
      VALUES
        ('Future Conference', '2056-04-26 10:00:00', 'Tallinn', 45, 'upcoming', 'Annual tech conference'),
        ('Tech Meetup', '2056-04-27 15:00:00', 'Tartu', 20, 'upcoming', ''),
        ('Past Workshop', '2025-04-24 12:00:00', 'Pärnu', 30, 'completed', 'Web development workshop')
      RETURNING id;
    `);
    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Failed to seed database:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

export async function clearDatabase() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'attendify',
    password: 'password',
    port: 5432,
  });

  try {
    await pool.query('DELETE FROM events; ALTER SEQUENCE events_id_seq RESTART WITH 1;');
    console.log('Database cleared successfully.');
  } catch (err) {
    console.error('Failed to clear database:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

export default async () => {
  await startDocker();
  await seedDatabase();
};
