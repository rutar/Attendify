const { startDocker } = require('./docker-control');
const { Pool } = require('pg');

async function seedDatabase() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'attendify',
    password: 'password',
    port: 5432,
  });

  try {
    await pool.query(`
      DELETE FROM events;
      INSERT INTO events (name, date_time, location, total_participants, status, additional_info)
      VALUES
        ('Future Conference', '2025-04-26 10:00:00', 'Tallinn', 45, 'upcoming', 'Annual tech conference'),
        ('Tech Meetup', '2025-04-27 15:00:00', 'Tartu', 20, 'upcoming', ''),
        ('Past Workshop', '2025-04-24 12:00:00', 'Pärnu', 30, 'completed', 'Web development workshop');
    `);
    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Failed to seed database:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

async function clearDatabase() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'attendify',
    password: 'password',
    port: 5432,
  });

  try {
    await pool.query('DELETE FROM events');
    console.log('Database cleared successfully.');
  } catch (err) {
    console.error('Failed to clear database:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

module.exports = {
  default: async () => {
    await startDocker();
    await seedDatabase();
  },
  clearDatabase,
};
