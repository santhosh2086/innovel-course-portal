import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Check server/.env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const courses = [
  ['MERN Stack Development', 'Learn MongoDB, Express, React and Node.js by building full-stack applications.', 4999],
  ['Frontend Development with React', 'Build responsive interfaces with React, reusable components, hooks and modern UI patterns.', 3999],
  ['Backend APIs with Node.js & Express', 'Design REST APIs, connect PostgreSQL, validate requests and build reliable server-side apps.', 4499],
  ['MongoDB & Database Design', 'Model data, write efficient queries and understand relationships, indexes and database design.', 2999],
  ['JavaScript Foundations', 'Strengthen your core JavaScript skills, from functions and arrays to async programming.', 1999],
  ['Career Launchpad: Git & Interviews', 'Practice Git workflows, portfolio basics, resume preparation and technical interview skills.', 1499],
  ['TypeScript for Modern Web Apps', 'Write safer JavaScript with TypeScript types, interfaces, generics and practical React patterns.', 2499],
  ['Python Programming Essentials', 'Learn Python syntax, functions, collections, file handling and automation through hands-on exercises.', 2499],
  ['UI/UX Design with Figma', 'Create user flows, wireframes, design systems and interactive prototypes for modern digital products.', 2999],
  ['DevOps with Docker & CI/CD', 'Package apps with Docker and understand build pipelines, deployments, environments and delivery workflows.', 3499],
  ['Cloud Fundamentals with AWS', 'Explore cloud computing, core AWS services, IAM, storage, networking and deployment fundamentals.', 3999],
  ['Data Structures & Algorithms', 'Practice problem solving with arrays, strings, stacks, queues, trees and algorithmic complexity.', 2999],
  ['Testing React Applications', 'Build confidence with component tests, user interactions, mocking and maintainable frontend test suites.', 2799],
  ['Full-Stack Projects Workshop', 'Plan and build portfolio-ready projects with authentication, APIs, database integration and deployment.', 4999],
];

try {
  const studentHash = await bcrypt.hash('ChangeMe123!', 10);
  const staffHash = await bcrypt.hash('ChangeMe123!', 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['Demo Student', 'student@example.com', studentHash, 'student']
  );
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['Demo Instructor', 'staff@example.com', staffHash, 'staff']
  );

  // Admin credentials requested for this project. Store only a bcrypt hash in PostgreSQL.
  const adminHash = await bcrypt.hash('santhosh2029', 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'admin'`,
    ['Innovel Admin', 'admin@gmail.com', adminHash]
  );

  for (const [title, description, price] of courses) {
    await pool.query(
      `INSERT INTO courses (title, description, price, currency, active)
       SELECT $1::varchar, $2::text, $3::numeric, 'INR', TRUE
       WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = $1)`,
      [title, description, price]
    );
  }

  const student = (await pool.query('SELECT id FROM users WHERE email = $1', ['student@example.com'])).rows[0];
  const courseRows = (await pool.query(
    `SELECT id, title FROM courses
     WHERE title = ANY($1::varchar[])
     ORDER BY id`,
    [courses.map(([title]) => title)]
  )).rows;

  // Seed clearly labelled sample enrolments so the demo account has a populated learning area.
  for (const course of courseRows.slice(0, 3)) {
    await pool.query(
      `INSERT INTO enrollments (student_id, course_id, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
      [student.id, course.id]
    );
  }

  const demoSessions = [
    { id: 'DEMO-MERN-001', title: 'MERN Stack Development', topic: 'Getting Started with the MERN Stack', days: 1, hour: 10 },
    { id: 'DEMO-REACT-001', title: 'Frontend Development with React', topic: 'React Components, Props & State', days: 2, hour: 14 },
    { id: 'DEMO-API-001', title: 'Backend APIs with Node.js & Express', topic: 'Building Your First REST API', days: 4, hour: 11 },
  ];
  for (const session of demoSessions) {
    const course = courseRows.find(c => c.title === session.title);
    if (!course) continue;
    await pool.query(
      `INSERT INTO zoom_meetings
         (course_id, batch_id, zoom_meeting_id, topic, start_time, duration, timezone, join_url, status)
       SELECT $1::integer, NULL::integer, $2::varchar(32), $3::varchar(200),
         (CURRENT_DATE + ($4::integer * INTERVAL '1 day') + ($5::integer * INTERVAL '1 hour'))::timestamp,
         60::integer, 'Asia/Kolkata'::varchar(48), NULL::varchar(400), 'scheduled'::text
       WHERE NOT EXISTS (
         SELECT 1 FROM zoom_meetings WHERE zoom_meeting_id = $2::varchar(32)
       )`,
      [course.id, session.id, session.topic, session.days, session.hour]
    );
  }

  console.log('Demo data ready: 13 courses, sample enrolments, and 3 sample class sessions.');
  console.log('Admin login: admin@gmail.com / santhosh2029');
  console.log('Student login: student@example.com / ChangeMe123!');
  console.log('Staff login: staff@example.com / ChangeMe123!');
  console.log('Sample class sessions have no real Zoom join URL. Configure Zoom credentials to schedule real meetings.');
  console.log('Existing user passwords are not overwritten if those emails already existed.');
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
