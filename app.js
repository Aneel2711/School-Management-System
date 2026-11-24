let appState = {
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

let currentView = 'dashboard';
let isServerOnline = false;

function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

async function syncWithBackend() {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      appState = await res.json();
      isServerOnline = true;
      document.getElementById('connection-badge').innerText = 'Connected (Node.js)';
      document.getElementById('connection-badge').style.background = '#d1fae5';
      document.getElementById('connection-badge').style.color = '#065f46';
    }
  } catch (err) {
    isServerOnline = false;
    document.getElementById('connection-badge').innerText = 'Static / Local Mode';
    document.getElementById('connection-badge').style.background = '#fef3c7';
    document.getElementById('connection-badge').style.color = '#92400e';
  }
  renderView();
}

function navigate(view, btn) {
  currentView = view;
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('view-title').innerText =
    view.charAt(0).toUpperCase() + view.slice(1);

  if (window.innerWidth <= 860) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  }
  renderView();
}

async function handleAddStudent(event) {
  event.preventDefault();
  const payload = {
    roll_no: document.getElementById('st-roll').value.trim(),
    full_name: document.getElementById('st-name').value.trim(),
    grade: document.getElementById('st-grade').value,
    parent_phone: document.getElementById('st-phone').value.trim(),
    fee_status: 'Pending'
  };

  if (isServerOnline) {
    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await syncWithBackend();
  } else {
    appState.students.unshift({ id: Date.now(), ...payload });
    renderView();
  }
}

async function handleDeleteStudent(id) {
  if (isServerOnline) {
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    await syncWithBackend();
  } else {
    appState.students = appState.students.filter(s => s.id !== id);
    renderView();
  }
}

async function handleAddTeacher(event) {
  event.preventDefault();
  const payload = {
    emp_id: document.getElementById('tc-id').value.trim(),
    full_name: document.getElementById('tc-name').value.trim(),
    subject: document.getElementById('tc-subject').value.trim(),
    email: document.getElementById('tc-email').value.trim(),
    salary: Number(document.getElementById('tc-salary').value)
  };

  if (isServerOnline) {
    await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await syncWithBackend();
  } else {
    appState.teachers.unshift({ id: Date.now(), ...payload });
    renderView();
  }
}

async function handleDeleteTeacher(id) {
  if (isServerOnline) {
    await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
    await syncWithBackend();
  } else {
    appState.teachers = appState.teachers.filter(t => t.id !== id);
    renderView();
  }
}

async function handleMarkAttendance(studentId, status) {
  if (isServerOnline) {
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, status })
    });
    await syncWithBackend();
  } else {
    appState.attendance[studentId] = status;
    renderView();
  }
}

async function handleToggleFee(studentId) {
  if (isServerOnline) {
    await fetch(`/api/students/${studentId}/fee`, { method: 'PATCH' });
    await syncWithBackend();
  } else {
    appState.students = appState.students.map(s =>
      s.id === studentId ? { ...s, fee_status: s.fee_status === 'Paid' ? 'Pending' : 'Paid' } : s
    );
    renderView();
  }
}

function renderView() {
  const container = document.getElementById('app-content');

  if (currentView === 'dashboard') {
    const paidCount = appState.students.filter(s => s.fee_status === 'Paid').length;
    const presentCount = Object.values(appState.attendance).filter(v => v === 'Present').length;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><span>Total Students</span><h3>${appState.students.length}</h3></div>
        <div class="stat-card"><span>Faculty Members</span><h3>${appState.teachers.length}</h3></div>
        <div class="stat-card"><span>Fees Cleared</span><h3 style="color:#10b981;">${paidCount} / ${appState.students.length}</h3></div>
        <div class="stat-card"><span>Present Today</span><h3>${presentCount}</h3></div>
      </div>

      <div class="card-panel">
        <h3>Recent Student Admissions</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student</th>
                <th>Class</th>
                <th>Guardian Contact</th>
                <th>Fee Status</th>
              </tr>
            </thead>
            <tbody>
              ${appState.students.slice(0, 6).map(st => `
                <tr>
                  <td><strong>${st.roll_no}</strong></td>
                  <td class="student-info">
                    <img src="assets/student-avatar.svg" alt="Avatar" width="30" height="30" />
                    ${st.full_name}
                  </td>
                  <td>${st.grade}</td>
                  <td>${st.parent_phone}</td>
                  <td>
                    <span class="pill ${st.fee_status === 'Paid' ? 'pill-paid' : 'pill-pending'}">
                      ${st.fee_status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (currentView === 'students') {
    container.innerHTML = `
      <div class="card-panel">
        <h3>Enroll New Student</h3>
        <form class="responsive-form" onsubmit="handleAddStudent(event)">
          <input id="st-roll" placeholder="Roll No (STD-104)" required />
          <input id="st-name" placeholder="Student Full Name" required />
          <select id="st-grade">
            <option value="8th Grade">8th Grade</option>
            <option value="9th Grade">9th Grade</option>
            <option value="10th Grade" selected>10th Grade</option>
            <option value="11th Grade">11th Grade</option>
            <option value="12th Grade">12th Grade</option>
          </select>
          <input id="st-phone" placeholder="Parent Phone" required />
          <button type="submit" class="btn btn-primary">Add Student</button>
        </form>
      </div>

      <div class="card-panel">
        <h3>Students Directory (${appState.students.length})</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Parent Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${appState.students.map(st => `
                <tr>
                  <td><strong>${st.roll_no}</strong></td>
                  <td>${st.full_name}</td>
                  <td>${st.grade}</td>
                  <td>${st.parent_phone}</td>
                  <td>
                    <button class="btn btn-danger" onclick="handleDeleteStudent(${st.id})">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (currentView === 'teachers') {
    container.innerHTML = `
      <div class="card-panel">
        <h3>Add Faculty Member</h3>
        <form class="responsive-form" onsubmit="handleAddTeacher(event)">
          <input id="tc-id" placeholder="Emp ID (TCH-03)" required />
          <input id="tc-name" placeholder="Teacher Name" required />
          <input id="tc-subject" placeholder="Subject" required />
          <input id="tc-email" type="email" placeholder="Email" required />
          <input id="tc-salary" type="number" placeholder="Salary" required />
          <button type="submit" class="btn btn-primary">Save Teacher</button>
        </form>
      </div>

      <div class="card-panel">
        <h3>Faculty Directory (${appState.teachers.length})</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Subject</th>
                <th>Email</th>
                <th>Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${appState.teachers.map(tc => `
                <tr>
                  <td><strong>${tc.emp_id}</strong></td>
                  <td>${tc.full_name}</td>
                  <td>${tc.subject}</td>
                  <td>${tc.email}</td>
                  <td>Rs. ${Number(tc.salary).toLocaleString()}</td>
                  <td>
                    <button class="btn btn-danger" onclick="handleDeleteTeacher(${tc.id})">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (currentView === 'attendance') {
    const today = new Date().toISOString().split('T')[0];
    container.innerHTML = `
      <div class="card-panel">
        <h3>Daily Attendance Register — ${today}</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${appState.students.map(st => {
                const status = appState.attendance[st.id] || 'Not Marked';
                const pillClass =
                  status === 'Present' ? 'pill-paid' :
                  status === 'Absent' ? 'pill-absent' : 'pill-pending';
                return `
                  <tr>
                    <td><strong>${st.roll_no}</strong></td>
                    <td>${st.full_name}</td>
                    <td>${st.grade}</td>
                    <td><span class="pill ${pillClass}">${status}</span></td>
                    <td>
                      <button class="btn btn-primary" style="padding:6px 12px; margin-right:6px;" onclick="handleMarkAttendance(${st.id}, 'Present')">Present</button>
                      <button class="btn btn-danger" onclick="handleMarkAttendance(${st.id}, 'Absent')">Absent</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (currentView === 'fees') {
    container.innerHTML = `
      <div class="card-panel">
        <h3>Student Fee Vouchers</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${appState.students.map(st => `
                <tr>
                  <td><strong>${st.roll_no}</strong></td>
                  <td>${st.full_name}</td>
                  <td>${st.grade}</td>
                  <td>
                    <span class="pill ${st.fee_status === 'Paid' ? 'pill-paid' : 'pill-pending'}">
                      ${st.fee_status}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-navy" onclick="handleToggleFee(${st.id})">
                      Switch to ${st.fee_status === 'Paid' ? 'Pending' : 'Paid'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

syncWithBackend();
