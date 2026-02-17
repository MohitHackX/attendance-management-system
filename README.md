# Attendance Management System (Galaxy Glassmorphism)

## Tech Stack
- Frontend: HTML / CSS / Vanilla JS
- Backend: Node.js + Express
- Database: MongoDB Atlas (Mongoose)
- Auth: JWT
- Staff passwords: bcrypt hashing
- Student login: Email OTP (Nodemailer)

---

## 1) MongoDB Atlas (Free M0) Setup
1. Create a **Free M0 Cluster** on MongoDB Atlas.
2. Create a **DB User** (username + password).
3. **Network Access**: allow your IP (or `0.0.0.0/0` for testing).
4. Get Connection String:
   - Connect → Drivers → copy URI
   - Replace `<password>` with your DB password

Example:
`MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ams?retryWrites=true&w=majority`

---

## 2) Replit Secrets / Local .env
Create `.env` (or Replit Secrets) with:
- `MONGODB_URI`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

If SMTP is not configured, OTP API will return a `devOtp` field for testing.

---

## 3) Install & Run
From project root:
```bash
npm install
npm start
```

Server runs on: `http://localhost:3000`

Frontend is served from `/public`.

API is served under `/api`.

---

## 4) Demo Admin (Auto Seed)
On first run, server auto-creates admin if not present:

Email: `admin@demo.com`  
Password: `Admin@1234`

You can override seed values using env:
- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASS`

---

## 5) Creating Demo Staff
1. Login as Admin
2. Create Departments
3. Create HOD for a department
4. Login as HOD
5. Create Teacher, Create Class, Create Subject, Create CR
6. Assign Teacher to Class

---

## 6) Student OTP Test
1. Choose department on landing page
2. Go Student OTP login
3. Send OTP
   - If SMTP not set, you will get `devOtp` in response (shown as toast)
4. Verify OTP
5. Complete Profile (name, deptCode, classId)
6. View attendance + announcements

---

## Notes
- Attendance double marking is prevented by a unique index:
  `classId + subjectId + date`
- OTP expires in 5 minutes, limited attempts and cooldown.
