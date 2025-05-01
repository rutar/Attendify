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
    await pool.query('TRUNCATE event_participant, persons, companies, participants, events RESTART IDENTITY CASCADE');

    const eventsRes = await pool.query(`
      INSERT INTO events (name, date_time, location, status, additional_info)
      VALUES
        ('Future Conference', '2056-04-26 10:00:00+00', 'Tallinn', 'upcoming', 'Annual tech conference'),
        ('Tech Meetup', '2056-04-27 15:00:00+00', 'Tartu', 'upcoming', ''),
        ('Past Workshop', '2025-04-24 12:00:00+00', 'Pärnu', 'completed', 'Web development workshop')
        RETURNING id;
    `);
    const [futureConfId, techMeetupId, pastWorkshopId] = eventsRes.rows.map(r => r.id);

    // Insert individual participants (type: PERSON)
    const participantsRes = await pool.query(`
      INSERT INTO participants (participant_type)
      VALUES ('PERSON'), ('PERSON'), ('PERSON')
      RETURNING id;
    `);
    const [aliceId, bobId, carolId] = participantsRes.rows.map(r => r.id);

    await pool.query(`
      INSERT INTO persons (id, first_name, last_name, personal_code, email, phone)
      VALUES
        (${aliceId}, 'Alice', 'Kask', '12345678901', 'alice@example.com', '555-1111'),
        (${bobId}, 'Bob', 'Mets', '12345678902', 'bob@example.com', '555-2222'),
        (${carolId}, 'Carol', 'Tamm', '12345678903', 'carol@example.com', '555-3333');
    `);

    // Insert event-participant links (attendance_status defaults to 'REGISTERED')
    const links = [
      [futureConfId, aliceId],
      [futureConfId, bobId],
      [techMeetupId, bobId],
      [techMeetupId, carolId],
      [pastWorkshopId, aliceId],
    ];
    for (const [eventId, participantId] of links) {
      await pool.query(
        `INSERT INTO event_participant (event_id, participant_id) VALUES ($1, $2);`,
        [eventId, participantId]
      );
    }

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
    await pool.query('TRUNCATE event_participant, persons, companies, participants, events RESTART IDENTITY CASCADE');
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
