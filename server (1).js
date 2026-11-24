const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    students: [
      { id: 101, roll_no: 'STD-101', full_name: 'Ali Raza', grade: '10th Grade', parent_phone: '0300-1234567', fee_status: 'Paid' },
      { id: 102, roll_no: 'STD-102', full_name: 'Ayesha Khan', grade: '9th Grade', parent_phone: '0321-7654321', fee_status: 'Pending' },
      { id: 103, roll_no: 'STD-103', full_name: 'Bilal Ahmed', grade: '10th Grade', parent_phone: '0333-9876543', fee_status: 'Paid' }
    ],
    teachers: [
      { id: 201, emp_id: 'TCH-01', full_name: 'Prof. Tariq Mahmood', subject: 'Mathematics', email: 'tariq@school.edu', salary: 65000 },
      { id: 202, emp_id: 'TCH-02', full_name: 'Ms. Sana Malik', subject: 'Computer Science', email: 'sana@school.edu', salary: 60000 }
    ],
    attendance: {}
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

const sendJSON = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return sendJSON(res, 200, {});

  if (req.url.startsWith('/api/')) {
    const db = readDB();

    if (req.method === 'GET' && req.url === '/api/state') {
      return sendJSON(res, 200, db);
    }

    if (req.method === 'POST' && req.url === '/api/students') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const payload = JSON.parse(body || '{}');
        const newStudent = {
          id: Date.now(),
          roll_no: payload.roll_no,
          full_name: payload.full_name,
          grade: payload.grade,
          parent_phone: payload.parent_phone,
          fee_status: payload.fee_status || 'Pending'
        };
        db.students.unshift(newStudent);
        writeDB(db);
        return sendJSON(res, 201, newStudent);
      });
      return;
    }

    if (req.method === 'DELETE' && req.url.startsWith('/api/students/')) {
      const id = Number(req.url.split('/').pop());
      db.students = db.students.filter(s => s.id !== id);
      delete db.attendance[id];
      writeDB(db);
      return sendJSON(res, 200, { deleted: true });
    }

    if (req.method === 'PATCH' && req.url.startsWith('/api/students/') && req.url.endsWith('/fee')) {
      const id = Number(req.url.split('/')[3]);
      db.students = db.students.map(s =>
        s.id === id ? { ...s, fee_status: s.fee_status === 'Paid' ? 'Pending' : 'Paid' } : s
      );
      writeDB(db);
      return sendJSON(res, 200, { updated: true });
    }

    if (req.method === 'POST' && req.url === '/api/teachers') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const payload = JSON.parse(body || '{}');
        const newTeacher = {
          id: Date.now(),
          emp_id: payload.emp_id,
          full_name: payload.full_name,
          subject: payload.subject,
          email: payload.email,
          salary: Number(payload.salary)
        };
        db.teachers.unshift(newTeacher);
        writeDB(db);
        return sendJSON(res, 201, newTeacher);
      });
      return;
    }

    if (req.method === 'DELETE' && req.url.startsWith('/api/teachers/')) {
      const id = Number(req.url.split('/').pop());
      db.teachers = db.teachers.filter(t => t.id !== id);
      writeDB(db);
      return sendJSON(res, 200, { deleted: true });
    }

    if (req.method === 'POST' && req.url === '/api/attendance') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', () => {
        const { student_id, status } = JSON.parse(body || '{}');
        db.attendance[student_id] = status;
        writeDB(db);
        return sendJSON(res, 200, { saved: true });
      });
      return;
    }

    return sendJSON(res, 404, { error: 'API route not found' });
  }

  let safePath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`EduCore Server running at http://localhost:${PORT}`);
});
