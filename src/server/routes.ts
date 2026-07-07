import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { run, all, get } from './db.js';

export const apiRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'CAMPUS_EVENT_AI_SECURE_TOKEN_2026';

// SMTP Transporter (optional config - fallback to logging)
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

// Initialize Google Gemini API
const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Middleware for token authentication
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token missing or invalid' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired session' });
      return;
    }
    req.user = decoded;
    next();
  });
}

// Middleware for admin validation
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Requires admin privileges' });
    return;
  }
  next();
}

// Helper to send registration confirmation email
async function sendConfirmationEmail(userEmail: string, studentName: string, eventName: string, regId: string, details: any, qrDataUrl: string) {
  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">XYZ College of Engineering</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">National Level Tech Symposium - TechFest 2026</p>
      </div>
      <div style="margin-bottom: 25px;">
        <h2 style="color: #111827; margin-top: 0; font-size: 18px;">Registration Confirmed!</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Dear <strong>${studentName}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">Congratulations! You have successfully registered for <strong>${eventName}</strong>. Below is your event pass details.</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Registration ID:</td>
            <td style="padding: 6px 0; color: #111827; font-weight: bold;">${regId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Event Name:</td>
            <td style="padding: 6px 0; color: #111827; font-weight: bold;">${eventName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Date:</td>
            <td style="padding: 6px 0; color: #111827;">${details.event_date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Time:</td>
            <td style="padding: 6px 0; color: #111827;">${details.event_time}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Venue:</td>
            <td style="padding: 6px 0; color: #111827;">${details.venue}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Payment Status:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: bold; text-transform: uppercase;">${details.payment_status}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-bottom: 25px;">
        <p style="color: #374151; font-size: 14px; margin-bottom: 10px;">Please show this QR Code at the registration desk on the event day.</p>
        <img src="${qrDataUrl}" alt="Registration QR Code" style="width: 180px; height: 180px; border: 1px solid #d1d5db; padding: 10px; border-radius: 4px;" />
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 12px; color: #9ca3af; text-align: center;">
        <p style="margin: 0 0 5px 0;">Coordinators: ${details.coordinator} | Faculty In-charge: ${details.faculty}</p>
        <p style="margin: 0;">This is an automated email. Please do not reply directly.</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"TechFest 2026" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[TechFest 2026] Registration Confirmed - ${eventName}`,
        html: htmlContent,
      });
      console.log('Confirmation email successfully sent via SMTP to:', userEmail);
    } catch (e) {
      console.error('SMTP Send Failed:', e);
    }
  } else {
    console.log('--- SMTP Not Configured. Simulated Confirmation Email Outflow ---');
    console.log('Recipient:', userEmail);
    console.log('Event Name:', eventName);
    console.log('Registration ID:', regId);
    console.log('--------------------------------------------------------------');
  }
}

// -------------------------------------------------------------
// PUBLIC AUTH ENDPOINTS
// -------------------------------------------------------------

apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, college, department, year, gender, firebase_uid } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required fields' });
      return;
    }

    // Check if user already exists
    const existing = await get(`SELECT * FROM users WHERE email = ?`, [email]);
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Insert user
    const result = await run(`
      INSERT INTO users (name, email, password, phone, college, department, year, gender, firebase_uid, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      email,
      password || null, // fallback for password auth
      phone || '',
      college || 'XYZ College of Engineering',
      department || '',
      year || '1',
      gender || 'Other',
      firebase_uid || null,
      'student' // default role is student
    ]);

    const createdUser = await get(`SELECT * FROM users WHERE id = ?`, [result.id]);
    const token = jwt.sign(
      { id: createdUser.id, email: createdUser.email, role: createdUser.role, name: createdUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Seed automatic registration success notification
    await run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [createdUser.id, 'Welcome to TechFest 2026', `Hi ${name}! Thank you for registering on CampusEvent AI. Browse events and start registering!`]);

    res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        phone: createdUser.phone,
        college: createdUser.college,
        department: createdUser.department,
        year: createdUser.year,
        gender: createdUser.gender,
        profile_image: createdUser.profile_image
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password, firebase_uid } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    let user;
    if (firebase_uid) {
      // Login via Firebase
      user = await get(`SELECT * FROM users WHERE firebase_uid = ? OR email = ?`, [firebase_uid, email]);
      if (!user) {
        // Automatically create account if firebase sign-in is successful but not in local SQLite database
        const defaultName = email.split('@')[0];
        const result = await run(`
          INSERT INTO users (name, email, firebase_uid, role, college)
          VALUES (?, ?, ?, ?, ?)
        `, [defaultName, email, firebase_uid, 'student', 'XYZ College of Engineering']);
        user = await get(`SELECT * FROM users WHERE id = ?`, [result.id]);
      }
    } else {
      // Normal password login fallback
      user = await get(`SELECT * FROM users WHERE email = ?`, [email]);
      if (!user) {
        res.status(400).json({ error: 'User does not exist. Please register first.' });
        return;
      }
      if (password && user.password !== password) {
        res.status(400).json({ error: 'Incorrect email or password combination' });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        college: user.college,
        department: user.department,
        year: user.year,
        gender: user.gender,
        profile_image: user.profile_image
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error during login' });
  }
});

// -------------------------------------------------------------
// PUBLIC EVENTS ENDPOINTS
// -------------------------------------------------------------

apiRouter.get('/events', async (req, res) => {
  try {
    const { search, category, feeType, status } = req.query;
    let query = `SELECT * FROM events WHERE is_active = 1`;
    const params: any[] = [];

    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR coordinator LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (feeType === 'Free') {
      query += ` AND fee = 0`;
    } else if (feeType === 'Paid') {
      query += ` AND fee > 0`;
    }

    // Sort by date upcoming
    query += ` ORDER BY event_date ASC`;

    const events = await all(query, params);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch events' });
  }
});

apiRouter.get('/events/categories', async (req, res) => {
  try {
    const rows = await all(`SELECT DISTINCT category FROM events WHERE is_active = 1`);
    res.json(rows.map(r => r.category));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/events/:id', async (req, res) => {
  try {
    const event = await get(`SELECT * FROM events WHERE id = ?`, [req.params.id]);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// STUDENT PROTECTED ENDPOINTS
// -------------------------------------------------------------

// Profile
apiRouter.get('/user/profile', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const user = await get(`SELECT id, name, email, phone, college, department, year, gender, profile_image, role, created_at FROM users WHERE id = ?`, [req.user!.id]);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/user/profile', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const { name, phone, college, department, year, gender, profile_image } = req.body;
    await run(`
      UPDATE users
      SET name = ?, phone = ?, college = ?, department = ?, year = ?, gender = ?, profile_image = ?
      WHERE id = ?
    `, [
      name || '',
      phone || '',
      college || 'XYZ College of Engineering',
      department || '',
      year || '1',
      gender || 'Other',
      profile_image || '',
      req.user!.id
    ]);

    const updated = await get(`SELECT id, name, email, phone, college, department, year, gender, profile_image, role FROM users WHERE id = ?`, [req.user!.id]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Favorites Toggle
apiRouter.post('/favorites', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const { event_id } = req.body;
    if (!event_id) {
      res.status(400).json({ error: 'event_id is required' });
      return;
    }

    const existing = await get(`SELECT * FROM favorites WHERE user_id = ? AND event_id = ?`, [req.user!.id, event_id]);
    if (existing) {
      await run(`DELETE FROM favorites WHERE user_id = ? AND event_id = ?`, [req.user!.id, event_id]);
      res.json({ favorited: false });
    } else {
      await run(`INSERT INTO favorites (user_id, event_id) VALUES (?, ?)`, [req.user!.id, event_id]);
      res.json({ favorited: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Favorite IDs for active student
apiRouter.get('/favorites', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const favs = await all(`SELECT event_id FROM favorites WHERE user_id = ?`, [req.user!.id]);
    res.json(favs.map(f => f.event_id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications
apiRouter.get('/notifications', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const list = await all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`, [req.user!.id]);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/notifications/read', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    await run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user!.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Event Registration Flow
apiRouter.post('/registrations', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const { event_id, phone, department, year, gender, college, payment_method, razorpay_payment_id } = req.body;

    if (!event_id) {
      res.status(400).json({ error: 'event_id is required' });
      return;
    }

    // 1. Fetch Event and user
    const event = await get(`SELECT * FROM events WHERE id = ?`, [event_id]);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.is_active === 0) {
      res.status(400).json({ error: 'Registrations are closed for this event' });
      return;
    }

    if (event.available_seats <= 0) {
      res.status(400).json({ error: 'No seats left! Sold out.' });
      return;
    }

    // Check duplicate
    const duplicate = await get(`SELECT * FROM registrations WHERE user_id = ? AND event_id = ?`, [req.user!.id, event_id]);
    if (duplicate) {
      res.status(400).json({ error: 'You have already registered for this event!' });
      return;
    }

    // Update student's phone, year, department, gender, college if they provided updated ones
    await run(`
      UPDATE users
      SET phone = ?, department = ?, year = ?, gender = ?, college = ?
      WHERE id = ?
    `, [
      phone || '',
      department || '',
      year || '1',
      gender || 'Other',
      college || 'XYZ College of Engineering',
      req.user!.id
    ]);

    // Unique Reg ID format: REG-YYYY-XXXX (REG-2026-4587)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const regId = `REG-2026-${randomNum}`;

    // 2. Generate QR Code containing registration ID
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      registration_id: regId,
      student_name: req.user!.name,
      event_title: event.title,
      venue: event.venue
    }));

    // Decide payment status
    const fee = event.fee;
    const paymentStatus = fee > 0 ? 'paid' : 'free';
    const txnId = razorpay_payment_id || (fee > 0 ? `TXN-MOCK-${Math.floor(Math.random() * 100000000)}` : 'FREE-PASS');

    // 3. Insert registration
    const regResult = await run(`
      INSERT INTO registrations (registration_id, user_id, event_id, payment_status, transaction_id, qr_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [regId, req.user!.id, event_id, paymentStatus, txnId, qrDataUrl]);

    // Insert payment record
    await run(`
      INSERT INTO payments (registration_id, amount, payment_method, transaction_id, status)
      VALUES (?, ?, ?, ?, ?)
    `, [regResult.id, fee, payment_method || 'Simulator', txnId, 'captured']);

    // 4. Decrement available seats
    await run(`UPDATE events SET available_seats = available_seats - 1 WHERE id = ?`, [event_id]);

    // 5. Create confirmation notification
    await run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [
      req.user!.id,
      'Registration Confirmed!',
      `You have registered successfully for ${event.title}. Download your ticket and bring it to ${event.venue} on ${event.event_date}!`
    ]);

    // 6. Send confirmation email
    await sendConfirmationEmail(req.user!.email, req.user!.name, event.title, regId, {
      event_date: event.event_date,
      event_time: event.event_time,
      venue: event.venue,
      payment_status: paymentStatus,
      coordinator: event.coordinator,
      faculty: event.faculty
    }, qrDataUrl);

    res.status(201).json({
      success: true,
      registration: {
        id: regResult.id,
        registration_id: regId,
        payment_status: paymentStatus,
        transaction_id: txnId,
        qr_code: qrDataUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// View My Registrations
apiRouter.get('/registrations', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const list = await all(`
      SELECT r.*, e.title as event_title, e.event_date, e.event_time, e.venue, e.coordinator, e.faculty, e.fee
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.registered_at DESC
    `, [req.user!.id]);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel registration (soft delete/hard delete)
apiRouter.delete('/registrations/:id', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const regId = req.params.id;
    // 1. Fetch registration
    const registration = await get(`SELECT * FROM registrations WHERE id = ? AND user_id = ?`, [regId, req.user!.id]);
    if (!registration) {
      res.status(404).json({ error: 'Registration not found' });
      return;
    }

    const event = await get(`SELECT * FROM events WHERE id = ?`, [registration.event_id]);
    if (!event) {
      res.status(404).json({ error: 'Event associated not found' });
      return;
    }

    // Check if event close date or event date has passed
    const today = new Date().toISOString().split('T')[0];
    if (event.event_date <= today) {
      res.status(400).json({ error: 'Cannot cancel registration for events that are happening today or have already concluded.' });
      return;
    }

    // 2. Delete registration
    await run(`DELETE FROM registrations WHERE id = ?`, [regId]);

    // 3. Increment available seats back
    await run(`UPDATE events SET available_seats = available_seats + 1 WHERE id = ?`, [registration.event_id]);

    // 4. Send notification
    await run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [
      req.user!.id,
      'Registration Cancelled',
      `Your registration for ${event.title} has been cancelled successfully.`
    ]);

    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PDF Ticket generation on-the-fly using pdf-lib
apiRouter.get('/registrations/:id/ticket', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const regId = req.params.id;
    const registration = await get(`
      SELECT r.*, e.title as event_title, e.event_date, e.event_time, e.venue, e.coordinator, e.faculty, u.name as student_name, u.email as student_email, u.department as student_dept, u.year as student_year
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND (r.user_id = ? OR u.role = 'admin')
    `, [regId, req.user!.id]);

    if (!registration) {
      res.status(404).json({ error: 'Ticket not found or unauthorized' });
      return;
    }

    // Generate clean PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 450]);
    const { width, height } = page.getSize();

    // Standard fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw Ticket Frame
    page.drawRectangle({
      x: 15,
      y: 15,
      width: width - 30,
      height: height - 30,
      borderColor: rgb(0.12, 0.23, 0.54), // blue #1e3a8a
      borderWidth: 2,
    });

    // Draw Header Background
    page.drawRectangle({
      x: 17,
      y: height - 85,
      width: width - 34,
      height: 68,
      color: rgb(0.12, 0.23, 0.54),
    });

    // Header text
    page.drawText('XYZ COLLEGE OF ENGINEERING', {
      x: 35,
      y: height - 42,
      size: 18,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('NATIONAL LEVEL SYMPOSIUM - TECHFEST 2026', {
      x: 35,
      y: height - 62,
      size: 11,
      font: helvetica,
      color: rgb(0.8, 0.85, 0.95),
    });

    page.drawText('EVENT ENTRY PASS', {
      x: width - 180,
      y: height - 45,
      size: 14,
      font: helveticaBold,
      color: rgb(1, 0.8, 0.2), // gold
    });

    // Content Labels and Values
    const startY = height - 120;
    const lineSpacing = 24;

    const data = [
      { label: 'Registration ID:', val: registration.registration_id },
      { label: 'Student Name:', val: registration.student_name },
      { label: 'Department/Year:', val: `${registration.student_dept || 'General'} - Yr ${registration.student_year || '1'}` },
      { label: 'Registered Event:', val: registration.event_title },
      { label: 'Date & Time:', val: `${registration.event_date} at ${registration.event_time}` },
      { label: 'Event Venue:', val: registration.venue },
      { label: 'Coordinator:', val: registration.coordinator },
      { label: 'Payment Status:', val: registration.payment_status.toUpperCase() },
    ];

    data.forEach((item, index) => {
      const y = startY - index * lineSpacing;
      page.drawText(item.label, {
        x: 40,
        y: y,
        size: 11,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(item.val.toString(), {
        x: 180,
        y: y,
        size: 11,
        font: helvetica,
        color: item.label === 'Registration ID:' ? rgb(0.12, 0.23, 0.54) : rgb(0.1, 0.1, 0.1),
      });
    });

    // Embed QR Code in the PDF if QR is loaded
    if (registration.qr_code) {
      try {
        const qrBase64 = registration.qr_code.split(',')[1];
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
        page.drawImage(qrImage, {
          x: width - 190,
          y: 60,
          width: 140,
          height: 140,
        });
      } catch (qrErr) {
        console.error('Failed to embed QR code to PDF:', qrErr);
      }
    }

    // Draw Footer Divider
    page.drawLine({
      start: { x: 30, y: 50 },
      end: { x: width - 30, y: 50 },
      color: rgb(0.8, 0.8, 0.8),
      thickness: 1,
    });

    // Instructions
    page.drawText('INSTRUCTIONS: Please bring a printed pass or digital copy to the venue on time. Late entry barred.', {
      x: 40,
      y: 34,
      size: 8,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pass_${registration.registration_id}.pdf`);
    res.end(Buffer.from(pdfBytes));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to download PDF ticket' });
  }
});

// AI chat endpoint using @google/genai
apiRouter.post('/ai/chat', authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'message is required in request body' });
      return;
    }

    // 1. Fetch entire events catalog (context)
    const events = await all(`SELECT * FROM events WHERE is_active = 1`);
    // 2. Fetch student profile and registrations (context)
    const user = await get(`SELECT * FROM users WHERE id = ?`, [req.user!.id]);
    const registrations = await all(`
      SELECT r.registration_id, r.payment_status, e.title as event_title, e.event_date, e.venue
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ?
    `, [req.user!.id]);

    const eventsContext = events.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      description: e.description,
      venue: e.venue,
      date: e.event_date,
      time: e.event_time,
      fee: e.fee === 0 ? 'Free' : `₹${e.fee}`,
      seats_left: e.available_seats,
      coordinator: e.coordinator
    }));

    const registrationsContext = registrations.map(r => ({
      reg_id: r.registration_id,
      event: r.event_title,
      date: r.event_date,
      venue: r.venue,
      payment: r.payment_status
    }));

    const systemInstruction = `
You are the CampusEvent AI Assistant for XYZ College of Engineering's national level tech symposium (TechFest 2026).
Your goal is to assist students with their symposium experience.

Guidelines:
1. Provide accurate details based ONLY on the provided events catalog and student's registered events.
2. DO NOT make up dates, fees, venue names, or any events.
3. If the user asks for suggestions (e.g., "for beginners"), suggest suitable workshops from the Technical or Non-Technical events listed.
4. For registration questions, explain that they can click the "Register" button on any event card.
5. Provide clear, professional, and cheerful answers formatted in clean Markdown.
6. If the user query is unrelated to the college events or registrations, politely decline and steer them back to TechFest 2026.

Student Details:
- Name: ${user.name}
- College: ${user.college}
- Department: ${user.department || 'General'}, Year: ${user.year || '1'}

Available TechFest 2026 Events Catalog:
${JSON.stringify(eventsContext, null, 2)}

Student's Current Event Registrations:
${JSON.stringify(registrationsContext, null, 2)}
    `;

    if (aiClient) {
      try {
        const aiResponse = await aiClient.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: message,
          config: {
            systemInstruction
          }
        });
        res.json({ reply: aiResponse.text || 'I encountered an issue processing that query. Please try again!' });
      } catch (geminiErr: any) {
        console.error('Gemini API Invocation Error:', geminiErr);
        res.status(500).json({ reply: "I'm having trouble connecting to my AI brain right now, but feel free to browse the events using our handy search and category filters on the Events page!" });
      }
    } else {
      // Graceful local smart chatbot if GEMINI_API_KEY is not configured
      const lower = message.toLowerCase();
      let response = `Hello ${user.name}! I am currently running in offline preview mode. Here is a helpful response based on your query:\n\n`;

      if (lower.includes('free')) {
        const freeEvents = events.filter(e => e.fee === 0).map(e => `- **${e.title}** (${e.category}) at ${e.venue}`);
        response += `Here are the **Free Events** available at TechFest 2026:\n${freeEvents.join('\n')}`;
      } else if (lower.includes('technical') || lower.includes('tech')) {
        const techEvents = events.filter(e => e.category === 'Technical').slice(0, 5).map(e => `- **${e.title}** (₹${e.fee}) - Venue: ${e.venue}`);
        response += `Here are some of our popular **Technical Events**:\n${techEvents.join('\n')}\n\nAnd much more! Check out the full listing on the Events tab.`;
      } else if (lower.includes('status') || lower.includes('registered') || lower.includes('my event')) {
        if (registrationsContext.length === 0) {
          response += "You haven't registered for any events yet! Head over to the **Events** tab to claim your passes.";
        } else {
          const listStr = registrationsContext.map(r => `- **${r.event}** on ${r.date} (Pass: \`${r.reg_id}\`, Status: **${r.payment}**)`).join('\n');
          response += `You are currently registered for the following events:\n${listStr}`;
        }
      } else {
        response += `Welcome to TechFest 2026! We have **20 premier Technical and Non-Technical events** including Workshops, coding contests, Hackathons, Treasure Hunt, and Music competitions.\n\nType **"free events"**, **"technical events"**, or **"my status"** to get contextual recommendations from me!`;
      }
      res.json({ reply: response });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// -------------------------------------------------------------
// ADMIN PROTECTED ENDPOINTS (AUTH + ROLE=ADMIN REQUIRED)
// -------------------------------------------------------------

// Create Event
apiRouter.post('/admin/events', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const { title, category, description, rules, venue, event_date, event_time, coordinator, faculty, capacity, fee, image_url } = req.body;

    if (!title || !category || !event_date || !event_time || !capacity) {
      res.status(400).json({ error: 'Title, category, date, time, and capacity are required' });
      return;
    }

    const seats = parseInt(capacity);
    const eventFee = parseFloat(fee || '0');

    const result = await run(`
      INSERT INTO events (title, category, description, rules, venue, event_date, event_time, coordinator, faculty, capacity, available_seats, fee, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      category,
      description || '',
      rules || '',
      venue || 'Campus Auditorium',
      event_date,
      event_time,
      coordinator || 'Student Coordinator',
      faculty || 'Faculty Advisor',
      seats,
      seats, // available seats = capacity initially
      eventFee,
      image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
    ]);

    // Broadcast notification to all student users about new event
    const users = await all(`SELECT id FROM users WHERE role = 'student'`);
    for (const u of users) {
      await run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `, [u.id, '📢 New Event Added!', `A brand new event "${title}" was just added to TechFest 2026! Check it out and register now!`]);
    }

    const created = await get(`SELECT * FROM events WHERE id = ?`, [result.id]);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Event
apiRouter.put('/admin/events/:id', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const { title, category, description, rules, venue, event_date, event_time, coordinator, faculty, capacity, fee, image_url } = req.body;
    const eventId = req.params.id;

    const oldEvent = await get(`SELECT * FROM events WHERE id = ?`, [eventId]);
    if (!oldEvent) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const newCapacity = parseInt(capacity);
    const capacityDiff = newCapacity - oldEvent.capacity;
    const newAvailable = Math.max(0, oldEvent.available_seats + capacityDiff);

    await run(`
      UPDATE events
      SET title = ?, category = ?, description = ?, rules = ?, venue = ?, event_date = ?, event_time = ?, coordinator = ?, faculty = ?, capacity = ?, available_seats = ?, fee = ?, image_url = ?
      WHERE id = ?
    `, [
      title,
      category,
      description,
      rules,
      venue,
      event_date,
      event_time,
      coordinator,
      faculty,
      newCapacity,
      newAvailable,
      parseFloat(fee || '0'),
      image_url,
      eventId
    ]);

    const updated = await get(`SELECT * FROM events WHERE id = ?`, [eventId]);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Close Registrations (Toggle is_active)
apiRouter.patch('/admin/events/:id/close', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const event = await get(`SELECT * FROM events WHERE id = ?`, [req.params.id]);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const nextState = event.is_active === 1 ? 0 : 1;
    await run(`UPDATE events SET is_active = ? WHERE id = ?`, [nextState, req.params.id]);

    res.json({ success: true, is_active: nextState });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Soft Delete Event
apiRouter.delete('/admin/events/:id', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const event = await get(`SELECT * FROM events WHERE id = ?`, [req.params.id]);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    // soft delete
    await run(`UPDATE events SET is_active = 0 WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Event soft deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update capacity only
apiRouter.patch('/admin/events/:id/seats', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const { capacity } = req.body;
    const eventId = req.params.id;

    if (!capacity) {
      res.status(400).json({ error: 'Capacity is required' });
      return;
    }

    const event = await get(`SELECT * FROM events WHERE id = ?`, [eventId]);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const newCap = parseInt(capacity);
    const diff = newCap - event.capacity;
    const newAvail = Math.max(0, event.available_seats + diff);

    await run(`UPDATE events SET capacity = ?, available_seats = ? WHERE id = ?`, [newCap, newAvail, eventId]);
    res.json({ success: true, capacity: newCap, available_seats: newAvail });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Registrations list for admin
apiRouter.get('/admin/registrations', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT r.*, e.title as event_title, e.fee as event_fee, u.name as student_name, u.email as student_email, u.phone as student_phone, u.department as student_dept, u.year as student_year
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE u.name LIKE ? OR u.email LIKE ? OR e.title LIKE ? OR r.registration_id LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY r.registered_at DESC`;

    const list = await all(query, params);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export Registrations Report as CSV (Excel compatible)
apiRouter.get('/admin/registrations/export/excel', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const registrations = await all(`
      SELECT r.registration_id, u.name as student_name, u.email as student_email, u.phone as student_phone, u.college as student_college, u.department as student_dept, u.year as student_year, e.title as event_title, e.category, e.fee, r.payment_status, r.transaction_id, r.registered_at
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.registered_at DESC
    `);

    // Generate CSV contents
    const headers = [
      'Registration ID',
      'Student Name',
      'Student Email',
      'Student Phone',
      'College',
      'Department',
      'Year',
      'Event Name',
      'Category',
      'Fee (INR)',
      'Payment Status',
      'Transaction ID',
      'Registration Date'
    ];

    const csvRows = [headers.join(',')];

    for (const r of registrations) {
      const row = [
        r.registration_id,
        `"${r.student_name.replace(/"/g, '""')}"`,
        r.student_email,
        r.student_phone || '',
        `"${r.student_college.replace(/"/g, '""')}"`,
        r.student_dept || '',
        r.student_year || '',
        `"${r.event_title.replace(/"/g, '""')}"`,
        r.category,
        r.fee,
        r.payment_status,
        r.transaction_id || '',
        r.registered_at
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=symposium_registrations_report_2026.csv');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Payments Report
apiRouter.get('/admin/payments', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const list = await all(`
      SELECT p.*, r.registration_id, e.title as event_title, u.name as student_name, u.email as student_email
      FROM payments p
      JOIN registrations r ON p.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users List Search
apiRouter.get('/admin/users', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = `SELECT id, name, email, phone, college, department, year, gender, role, created_at FROM users`;
    const params: any[] = [];

    if (search) {
      query += ` WHERE name LIKE ? OR email LIKE ? OR department LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;
    const users = await all(query, params);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Dashboard metrics
apiRouter.get('/admin/analytics', [authenticateToken, requireAdmin] as any, async (req: Request, res: Response) => {
  try {
    // 1. Total student users
    const totalUsers = await get(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);

    // 2. Total registrations
    const totalRegistrations = await get(`SELECT COUNT(*) as count FROM registrations`);

    // 3. Total revenue
    const totalRevenue = await get(`SELECT SUM(amount) as revenue FROM payments WHERE status = 'captured'`);

    // 4. Most popular event
    const popularEvent = await get(`
      SELECT e.title, COUNT(r.id) as registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY registrations DESC
      LIMIT 1
    `);

    // 5. Category distribution
    const categories = await all(`
      SELECT category, COUNT(id) as count
      FROM events
      GROUP BY category
    `);

    // 6. Registration summary by day (last 7 days)
    const dailyRegistrations = await all(`
      SELECT DATE(registered_at) as date, COUNT(id) as count
      FROM registrations
      GROUP BY DATE(registered_at)
      ORDER BY DATE(registered_at) DESC
      LIMIT 7
    `);

    // 7. Event-wise seat vacancy summary
    const seatsSummary = await all(`
      SELECT title, capacity, available_seats, (capacity - available_seats) as registered
      FROM events
      WHERE is_active = 1
      ORDER BY registered DESC
    `);

    res.json({
      summary: {
        totalUsers: totalUsers?.count || 0,
        totalRegistrations: totalRegistrations?.count || 0,
        totalRevenue: totalRevenue?.revenue || 0,
        popularEvent: popularEvent?.title || 'None',
        popularEventCount: popularEvent?.registrations || 0,
      },
      categories,
      dailyRegistrations: dailyRegistrations.reverse(),
      seatsSummary
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
