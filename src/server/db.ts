import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'campus_events.db');
const db = new sqlite3.Database(dbPath);

export function run(query: string, params: any[] = []): Promise<{ id: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        console.error('SQL Error (run):', err, 'Query:', query);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

export function all(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('SQL Error (all):', err, 'Query:', query);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

export function get(query: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('SQL Error (get):', err, 'Query:', query);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Initialize tables and seed events
export async function initDatabase() {
  console.log('Initializing database at:', dbPath);

  // 1. Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_uid TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      phone TEXT,
      college TEXT,
      department TEXT,
      year TEXT,
      gender TEXT,
      profile_image TEXT,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Events table
  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      rules TEXT,
      venue TEXT,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      coordinator TEXT,
      faculty TEXT,
      capacity INTEGER NOT NULL,
      available_seats INTEGER NOT NULL,
      fee REAL DEFAULT 0,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      registration_close_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Registrations table
  await run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      transaction_id TEXT,
      qr_code TEXT,
      pdf_ticket_url TEXT,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(user_id, event_id)
    )
  `);

  // 4. Payments table
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      status TEXT DEFAULT 'created',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
    )
  `);

  // 5. Notifications table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 6. Favorites table
  await run(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, event_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  // Seed default admin and user if not exists
  const adminExists = await get(`SELECT * FROM users WHERE email = ?`, ['admin@xyzcollege.edu']);
  if (!adminExists) {
    await run(`
      INSERT INTO users (name, email, password, role, college, department, year, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Professor Sarah Jenkins',
      'admin@xyzcollege.edu',
      'adminpassword',
      'admin',
      'XYZ College of Engineering',
      'Computer Science',
      '4',
      '9876543210'
    ]);
    console.log('Seeded admin user (admin@xyzcollege.edu / adminpassword)');
  }

  const adminSymposiumExists = await get(`SELECT * FROM users WHERE email = ?`, ['admin@symposium.com']);
  if (!adminSymposiumExists) {
    await run(`
      INSERT INTO users (name, email, password, role, college, department, year, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Command Administrator',
      'admin@symposium.com',
      'admin123',
      'admin',
      'XYZ College of Engineering',
      'Administration',
      '4',
      '9999999999'
    ]);
    console.log('Seeded admin user (admin@symposium.com / admin123)');
  }

  const studentExists = await get(`SELECT * FROM users WHERE email = ?`, ['student@xyzcollege.edu']);
  if (!studentExists) {
    await run(`
      INSERT INTO users (name, email, password, role, college, department, year, phone, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Alex Rivera',
      'student@xyzcollege.edu',
      'studentpassword',
      'student',
      'XYZ College of Engineering',
      'Information Technology',
      '3',
      '9012345678',
      'Male'
    ]);
    console.log('Seeded demo student user (student@xyzcollege.edu / studentpassword)');
  }

  const studentSymposiumExists = await get(`SELECT * FROM users WHERE email = ?`, ['student@symposium.com']);
  if (!studentSymposiumExists) {
    await run(`
      INSERT INTO users (name, email, password, role, college, department, year, phone, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Demo Student',
      'student@symposium.com',
      'student123',
      'student',
      'XYZ College of Engineering',
      'Information Technology',
      '2',
      '8888888888',
      'Other'
    ]);
    console.log('Seeded demo student user (student@symposium.com / student123)');
  }

  // Seed 20 Events if table is empty
  const eventsCount = await get(`SELECT COUNT(*) as count FROM events`);
  if (eventsCount.count === 0) {
    const eventsToSeed = [
      // Technical (1–10)
      {
        title: 'AI Workshop',
        category: 'Technical',
        description: 'An intensive, hands-on masterclass on building and deploying generative AI solutions using state-of-the-art LLMs, neural networks, and Google Gemini. Students will build a live chatbot during the session.',
        rules: 'Bring your own laptop with Node.js and Python installed. Prior basic programming knowledge in JS/Python is helpful.',
        venue: 'Newton Auditorium (Block C)',
        event_date: '2026-09-10',
        event_time: '09:30 AM',
        coordinator: 'Rohan Sharma',
        faculty: 'Dr. Alan Turing',
        capacity: 100,
        fee: 300.0,
        image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Machine Learning Workshop',
        category: 'Technical',
        description: 'Dive deep into supervised and unsupervised learning, regression, classification trees, and model evaluation using scikit-learn and pandas.',
        rules: 'Bring a fully charged laptop. Jupyter Notebook environment pre-installed is highly recommended.',
        venue: 'DSP Lab (CSE Department, 3rd Floor)',
        event_date: '2026-09-10',
        event_time: '01:30 PM',
        coordinator: 'Ananya Rao',
        faculty: 'Dr. Grace Hopper',
        capacity: 60,
        fee: 250.0,
        image_url: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Full Stack Development Workshop',
        category: 'Technical',
        description: 'Learn to build highly scalable and responsive React + Node.js web applications, incorporating RESTful APIs, SQLite databases, and modern Tailwind CSS configurations.',
        rules: 'Prior exposure to HTML, CSS, and basic JavaScript. Laptops required.',
        venue: 'Vary Lab (IT Department, 2nd Floor)',
        event_date: '2026-09-11',
        event_time: '10:00 AM',
        coordinator: 'Vikram Aditya',
        faculty: 'Prof. Tim Berners-Lee',
        capacity: 80,
        fee: 200.0,
        image_url: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Cyber Security Workshop',
        category: 'Technical',
        description: 'A practical exploration into penetration testing, network security vulnerabilities, standard cryptographic principles, and ethical hacking techniques in sandbox environments.',
        rules: 'Strictly white-hat compliance. Laptops with Kali Linux VM or dual boot are recommended but not mandatory.',
        venue: 'Cyber Range Lab (Block A)',
        event_date: '2026-09-11',
        event_time: '02:00 PM',
        coordinator: 'Meera Nair',
        faculty: 'Dr. Bruce Schneier',
        capacity: 50,
        fee: 150.0,
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Robotics Workshop',
        category: 'Technical',
        description: 'Assemble and program an autonomous maze-solving micro-robot. Covers microcontrollers (Arduino/ESP32), motor drivers, and ultrasonic sensor integrations.',
        rules: 'Hardware kit will be provided for team work (max 3 per team). You must return hardware components at the end.',
        venue: 'Embedded Systems Lab (ECE Block)',
        event_date: '2026-09-12',
        event_time: '09:00 AM',
        coordinator: 'Karan Malhotra',
        faculty: 'Prof. Nikola Tesla',
        capacity: 40,
        fee: 400.0,
        image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'IoT Workshop',
        category: 'Technical',
        description: 'Connect sensors to cloud analytics platforms. Build real-world smart home telemetry solutions over MQTT protocol with zero-latency updates.',
        rules: 'Basic electronic circuits understanding. Free participation. Laptops required.',
        venue: 'IoT Center of Excellence (Block B)',
        event_date: '2026-09-12',
        event_time: '01:30 PM',
        coordinator: 'Shreya Ghoshal',
        faculty: 'Dr. Vint Cerf',
        capacity: 70,
        fee: 0.0,
        image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Coding Contest',
        category: 'Technical',
        description: 'The ultimate algorithmic battleground! Solve 5 challenging computer science problems in 3 hours. Supported languages: C++, Java, Python, JavaScript.',
        rules: 'Individual event. No external templates, AI assistants, or search. Plagiarism results in immediate disqualification.',
        venue: 'Main Computer Center (Central Library)',
        event_date: '2026-09-13',
        event_time: '10:00 AM',
        coordinator: 'Siddharth Sen',
        faculty: 'Dr. Donald Knuth',
        capacity: 150,
        fee: 150.0,
        image_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Debugging Challenge',
        category: 'Technical',
        description: 'Race against time to find and squash memory leaks, logic bugs, security loopholes, and compilation issues in obscure C and Java codebases.',
        rules: 'Individual event. Fastest correct debug submission wins. 2 rounds.',
        venue: 'Project Lab (Block D)',
        event_date: '2026-09-13',
        event_time: '02:30 PM',
        coordinator: 'Priya Patel',
        faculty: 'Prof. Ken Thompson',
        capacity: 100,
        fee: 50.0,
        image_url: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Hackathon',
        category: 'Technical',
        description: 'A 24-hour sprint to build innovative software or hardware solutions solving municipal or environmental campus challenges. Amazing cash prizes!',
        rules: 'Team size: 2-4 members. Submit abstract on Day 1. Final presentation to expert jury on Day 2.',
        venue: 'Innovation Hub Incubator (Block E)',
        event_date: '2026-09-14',
        event_time: '09:00 AM',
        coordinator: 'Arjun Kapoor',
        faculty: 'Dr. Richard Feynman',
        capacity: 120,
        fee: 500.0,
        image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'UI/UX Design Competition',
        category: 'Technical',
        description: 'Reimagine and design the layout of a modern mobile health and wellness portal in Figma. Show your prototyping, wireframing, and design system skills.',
        rules: 'Bring Figma account and dynamic prototypes. Individual or teams of max 2. Time limit: 3 hours.',
        venue: 'Multimedia Design Studio (Block F)',
        event_date: '2026-09-14',
        event_time: '02:00 PM',
        coordinator: 'Zara Khan',
        faculty: 'Prof. Don Norman',
        capacity: 90,
        fee: 100.0,
        image_url: 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80'
      },

      // Non-Technical (11-20)
      {
        title: 'Paper Presentation',
        category: 'Non-Technical',
        description: 'Present your original academic research, survey papers, or industry case studies in front of an expert panel of professors and researchers.',
        rules: 'Time limit: 8 minutes + 2 minutes Q&A. PowerPoint format. Submit research abstract 2 days prior.',
        venue: 'Seminar Hall 1 (Admin Block)',
        event_date: '2026-09-15',
        event_time: '09:30 AM',
        coordinator: 'Sanya Gupta',
        faculty: 'Dr. C.V. Raman',
        capacity: 50,
        fee: 200.0,
        image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Poster Presentation',
        category: 'Non-Technical',
        description: 'Showcase complex engineering concept summaries or environmental initiatives via creative, high-impact poster boards in our main gallery.',
        rules: 'Standard A1 poster size. Must be manually or digitally designed and printed. Teams of max 2.',
        venue: 'Exhibition Corridor (Admin Block)',
        event_date: '2026-09-15',
        event_time: '01:30 PM',
        coordinator: 'Rahul Verma',
        faculty: 'Prof. Homi Bhabha',
        capacity: 60,
        fee: 100.0,
        image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Technical Quiz',
        category: 'Non-Technical',
        description: 'The premier brain battle covering pop-culture, technological histories, logic riddles, and general science trivia. Exciting rounds!',
        rules: 'Teams of 2. Written prelims round followed by top 6 stage finals. Buzzer rounds included.',
        venue: 'Mini Auditorium (Civil Block)',
        event_date: '2026-09-16',
        event_time: '10:00 AM',
        coordinator: 'Divya Iyer',
        faculty: 'Dr. APJ Abdul Kalam',
        capacity: 120,
        fee: 50.0,
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Photography Contest',
        category: 'Non-Technical',
        description: 'Capture the soul of our campus under the theme \"Shadows & Light\". Open to both smartphone and DSLR enthusiasts.',
        rules: 'Submit 2 original high-res photos taken within campus. No heavy composites. Free registration.',
        venue: 'Art Center (Gallery Room 2)',
        event_date: '2026-09-16',
        event_time: '02:00 PM',
        coordinator: 'Varun Dhawan',
        faculty: 'Prof. Ansel Adams',
        capacity: 80,
        fee: 0.0,
        image_url: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Short Film Competition',
        category: 'Non-Technical',
        description: 'Screen your original, self-directed short cinematic films under the theme \"Tomorrow\'s Future\". Award ceremony directly after screenings.',
        rules: 'Duration: 3 to 10 minutes. Format: MP4 1080p. Content must be original with copyright-free audio/music.',
        venue: 'Main Seminar Hall (Block F)',
        event_date: '2026-09-17',
        event_time: '09:00 AM',
        coordinator: 'Nikhil Roy',
        faculty: 'Dr. Satyajit Ray',
        capacity: 80,
        fee: 150.0,
        image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Dance Competition',
        category: 'Non-Technical',
        description: 'Showcase your high-octane rhythmic performance. Solo and group performances in classical, western, hip-hop, or folk categories.',
        rules: 'Time limit: solo (3 mins), group (5 mins). Bring music track on pen-drive 1 hour before start.',
        venue: 'Open Air Theatre (OAT)',
        event_date: '2026-09-17',
        event_time: '01:30 PM',
        coordinator: 'Sneha Reddy',
        faculty: 'Prof. Rukmini Devi',
        capacity: 200,
        fee: 100.0,
        image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Singing Competition',
        category: 'Non-Technical',
        description: 'Unleash your vocal chords. Classical, contemporary, Bollywood, and western genres are fully welcome with acoustic accompaniments.',
        rules: 'Time limit: 4 minutes. Solo performances only. A single accompanying instrument or karaoke backing is permitted.',
        venue: 'Music Club Room (OAT Block)',
        event_date: '2026-09-18',
        event_time: '10:00 AM',
        coordinator: 'Aditya Sen',
        faculty: 'Dr. M.S. Subbulakshmi',
        capacity: 100,
        fee: 50.0,
        image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Treasure Hunt',
        category: 'Non-Technical',
        description: 'Solve structural mysteries and decrypt cryptograms across the entire campus. Locate hidden tokens and win the Grand Bounty!',
        rules: 'Team size: 3-4 members. Running/speed is allowed. Zero destruction of college properties.',
        venue: 'Fountain Square (Main Lawn)',
        event_date: '2026-09-18',
        event_time: '02:00 PM',
        coordinator: 'Kabir Mehta',
        faculty: 'Prof. Indiana Jones',
        capacity: 150,
        fee: 150.0,
        image_url: 'https://images.unsplash.com/photo-1513829096960-ef4a3dc90d85?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Entrepreneurship Seminar',
        category: 'Non-Technical',
        description: 'Gain insights from successful tech founders, venture capitalists, and incubation leaders regarding market fit, pitch decks, and initial fundraising.',
        rules: 'Free entry. Interactive session. Registration mandatory. Dress code: Smart Casual.',
        venue: 'Auditorium 2 (Admin Block)',
        event_date: '2026-09-19',
        event_time: '10:30 AM',
        coordinator: 'Riddhima Joshi',
        faculty: 'Dr. Peter Drucker',
        capacity: 120,
        fee: 0.0,
        image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Resume Building Workshop',
        category: 'Non-Technical',
        description: 'Get your resume professionally critiqued. Learn modern ATS (Applicant Tracking System) alignment tricks, portfolio structures, and interview tips.',
        rules: 'Free entry. Bring hardcopy resume draft or digital copy on laptop for real-time reviews.',
        venue: 'Placement Training Cell (Block D)',
        event_date: '2026-09-19',
        event_time: '02:30 PM',
        coordinator: 'Manish Verma',
        faculty: 'Prof. Sheryl Sandberg',
        capacity: 150,
        fee: 0.0,
        image_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const e of eventsToSeed) {
      // Set close date to 1 day before event
      const dateParts = e.event_date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() - 1);
      const closeDateStr = d.toISOString().split('T')[0];

      await run(`
        INSERT INTO events (
          title, category, description, rules, venue, event_date, event_time,
          coordinator, faculty, capacity, available_seats, fee, image_url, registration_close_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        e.title,
        e.category,
        e.description,
        e.rules,
        e.venue,
        e.event_date,
        e.event_time,
        e.coordinator,
        e.faculty,
        e.capacity,
        e.capacity, // initially available = capacity
        e.fee,
        e.image_url,
        closeDateStr
      ]);
    }
    console.log('Seeded 20 college symposium events successfully.');
  } else {
    console.log('Events table already contains', eventsCount.count, 'records. Skipping seeding.');
  }

  console.log('Database initialization completed.');
}
