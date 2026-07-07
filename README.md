#  CampusEventAI

CampusEventAI is an AI-powered college event management system that enables students to discover events, register online, receive QR code tickets, and get instant email confirmations. The platform also provides an admin dashboard to manage events and registrations efficiently.

---

##  Features

-  Secure User Authentication
-  AI-Powered Event Assistant
-  Browse and Register for Events
-  Admin Dashboard
-  Automatic QR Code Ticket Generation
-  PDF Ticket Generation
-  Email Confirmation Notifications
-  Responsive User Interface

---

##  Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- SQLite

### Authentication
- Firebase Authentication

### AI
- Google Gemini API

### Additional Libraries
- Nodemailer
- QR Code
- PDFKit

---

##  Project Workflow

1. User logs into the application.
2. Available events are displayed.
3. User selects an event and completes registration.
4. Registration details are stored in the database.
5. A QR code ticket and PDF ticket are generated.
6. A confirmation email is sent to the registered email address.
7. Admin can create, update, and manage events.

---

##  Project Structure

```
CampusEventAI
│── src/
│── assets/
│── package.json
│── package-lock.json
│── server.ts
│── vite.config.ts
│── tsconfig.json
│── README.md
```

---

##  Installation

Clone the repository

```bash
git clone https://github.com/Monisha0406/CampusEventAI.git
```

Navigate to the project

```bash
cd CampusEventAI
```

Install dependencies

```bash
npm install
```

Run the project

```bash
npm run dev
```

---

##  Problem Statement

Managing college events manually is time-consuming and often leads to registration errors, poor communication, and inefficient event management. CampusEventAI automates the complete event registration process with AI assistance, QR-based ticket generation, and email notifications.

---

##  Future Enhancements

- Online Payment Integration
- Attendance Tracking using QR Scan
- Event Recommendation using AI
- Certificate Generation
- Analytics Dashboard
- Mobile Application

