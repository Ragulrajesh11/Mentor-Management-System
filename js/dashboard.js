/**
 * js/dashboard.js
 * Strict Single Student View & Chart Height Fix
 */

let cgpaChartInstance = null;
let placementChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const userRole = sessionStorage.getItem('logged_user_role');
  if (!userRole) {
    logoutPortal();
    return;
  }

  await reloadDashboardData();
});

async function reloadDashboardData() {
  try {
    const userRole = sessionStorage.getItem('logged_user_role');
    const studentDataStr = sessionStorage.getItem('current_student');

    let currentLoggedInStudent = null;
    if (studentDataStr) {
      try {
        currentLoggedInStudent = JSON.parse(studentDataStr);
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    // 🔒 STUDENT PRIVACY: Show ONLY logged-in student's personal info
    if (userRole === 'student' && currentLoggedInStudent) {
      const studentName = currentLoggedInStudent.name || 'Student';
      const studentId = currentLoggedInStudent.id || currentLoggedInStudent.regNo || 'N/A';

      const nameElem = document.getElementById('user-display-name');
      if (nameElem) nameElem.innerText = studentName;

      const roleElem = document.getElementById('user-display-role');
      if (roleElem) roleElem.innerText = 'CSE Student';

      const avatarElem = document.getElementById('user-avatar-initials');
      if (avatarElem) avatarElem.innerText = studentName.substring(0, 2).toUpperCase();

      const dashNameElem = document.getElementById('dash-student-name');
      if (dashNameElem) dashNameElem.innerText = `Welcome, ${studentName}!`;

      const dashInfoElem = document.getElementById('dash-student-info');
      if (dashInfoElem) dashInfoElem.innerText = `Reg No: ${studentId} | ${currentLoggedInStudent.department || 'Computer Science & Engineering'}`;

      const banner = document.getElementById('student-welcome-banner');
      if (banner) {
        banner.style.display = 'block';
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(banner, 
            { opacity: 0, y: -20 }, 
            { opacity: 1, y: 0, duration: 0.6 }
          );
        }
      }
    } else {
      // Mentor View
      const nameElem = document.getElementById('user-display-name');
      if (nameElem) nameElem.innerText = 'Mr. M. RAGUL., B.E., M.E.';

      const roleElem = document.getElementById('user-display-role');
      if (roleElem) roleElem.innerText = 'Senior Mentor';

      const avatarElem = document.getElementById('user-avatar-initials');
      if (avatarElem) avatarElem.innerText = 'MR';

      const banner = document.getElementById('student-welcome-banner');
      if (banner) banner.style.display = 'none';
    }

    // Fetch Anonymous Aggregate Student Counts for Analytics
    let students = [];
    if (typeof fetchStudentsFromGitHub === 'function') {
      try {
        students = (await fetchStudentsFromGitHub()) || [];
      } catch (fetchErr) {
        console.error("GitHub Fetch Error:", fetchErr);
        students = [];
      }
    }

    const metricElem = document.getElementById('metric-students');
    if (metricElem) metricElem.innerText = Array.isArray(students) ? students.length : 0;

    renderCharts(students);
  } catch (globalErr) {
    console.error("Dashboard Load Error:", globalErr);
  }
}

function renderCharts(students) {
  const safeStudents = Array.isArray(students) ? students : [];

  if (cgpaChartInstance) cgpaChartInstance.destroy();
  if (placementChartInstance) placementChartInstance.destroy();

  // Anonymous Aggregate Counts
  const cgpa6to7 = safeStudents.filter(s => { const g = parseFloat(s.cgpa); return g >= 6.0 && g < 7.0; }).length;
  const cgpa7to8 = safeStudents.filter(s => { const g = parseFloat(s.cgpa); return g >= 7.0 && g < 8.0; }).length;
  const cgpa8to9 = safeStudents.filter(s => { const g = parseFloat(s.cgpa); return g >= 8.0 && g < 9.0; }).length;
  const cgpa9to10 = safeStudents.filter(s => { const g = parseFloat(s.cgpa); return g >= 9.0 && g <= 10.0; }).length;

  const cgpaBarCanvas = document.getElementById('cgpaChart');
  if (cgpaBarCanvas && typeof Chart === 'function') {
    const ctxBar = cgpaBarCanvas.getContext('2d');
    cgpaChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['6.0-6.9', '7.0-7.9', '8.0-8.9', '9.0-10.0'],
        datasets: [{
          label: 'Students Count',
          data: [cgpa6to7, cgpa7to8, cgpa8to9, cgpa9to10],
          backgroundColor: '#2563eb',
          borderRadius: 6
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } } 
      }
    });
  }

  // Safe Placement Fallback
  const placedCount = safeStudents.filter(s => (s.placementStatus ? s.placementStatus === 'Placed' : parseFloat(s.cgpa) >= 8.0)).length;
  const eligibleCount = safeStudents.filter(s => (s.placementStatus ? s.placementStatus === 'Eligible' : (parseFloat(s.cgpa) >= 6.5 && parseFloat(s.cgpa) < 8.0))).length;
  const ineligibleCount = safeStudents.filter(s => (s.placementStatus ? s.placementStatus === 'Ineligible' : parseFloat(s.cgpa) < 6.5)).length;

  const placementDoughnutCanvas = document.getElementById('placementChart');
  if (placementDoughnutCanvas && typeof Chart === 'function') {
    const ctxDoughnut = placementDoughnutCanvas.getContext('2d');
    placementChartInstance = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: ['Placed', 'Eligible', 'Ineligible'],
        datasets: [{
          data: [placedCount, eligibleCount, ineligibleCount],
          backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

// Absolute Clean Sign Out
function logoutPortal() {
  sessionStorage.clear();
  localStorage.clear();

  const currentPath = window.location.pathname;
  const projectFolder = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
  window.location.replace(window.location.origin + projectFolder + 'index.html');
}