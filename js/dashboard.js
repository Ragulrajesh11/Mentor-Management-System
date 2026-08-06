/**
 * js/dashboard.js
 * Paavai CSE Mentorship Portal - Analytics & Chart Renderer
 */

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

/**
 * Fetch Data & Update Dashboard Metrics and Charts
 */
async function loadDashboardData() {
  try {
    // 1. Fetch Students Data from GitHub Repository
    let students = [];
    if (typeof fetchStudentsFromGitHub === 'function') {
      students = await fetchStudentsFromGitHub() || [];
    }

    // 2. Update Key Metric Cards
    updateMetricCards(students);

    // 3. Render Dashboard Charts
    renderCGPAChart(students);
    renderPlacementChart(students);

  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

/**
 * Update Key Metrics (Mentees Count, Avg CGPA, Attendance)
 */
function updateMetricCards(students) {
  const studentCountEl = document.getElementById('metric-students');
  const cgpaEl = document.getElementById('metric-cgpa');

  // Total Active Mentees Count Dynamic Update
  if (studentCountEl) {
    studentCountEl.textContent = students.length;
  }

  // Batch Average CGPA Calculation
  if (cgpaEl && students.length > 0) {
    const totalCGPA = students.reduce((acc, student) => {
      const val = parseFloat(student.cgpa);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    
    const validStudents = students.filter(s => !isNaN(parseFloat(s.cgpa))).length;
    const avgCGPA = validStudents > 0 ? (totalCGPA / validStudents).toFixed(2) : '0.00';
    cgpaEl.textContent = avgCGPA;
  }
}

/**
 * Academic Performance Distribution Bar Chart
 */
let cgpaChartInstance = null;
function renderCGPAChart(students) {
  const ctx = document.getElementById('cgpaChart');
  if (!ctx) return;

  // Calculate CGPA Range Distributions
  let rangeBelow7 = 0;
  let range7to8 = 0;
  let range8to9 = 0;
  let rangeAbove9 = 0;

  students.forEach(s => {
    const cgpa = parseFloat(s.cgpa);
    if (!isNaN(cgpa)) {
      if (cgpa >= 9.0) rangeAbove9++;
      else if (cgpa >= 8.0) range8to9++;
      else if (cgpa >= 7.0) range7to8++;
      else rangeBelow7++;
    }
  });

  // Default Fallback values if database is empty
  if (students.length === 0) {
    rangeBelow7 = 2;
    range7to8 = 12;
    range8to9 = 25;
    rangeAbove9 = 8;
  }

  // Destroy previous instance to prevent overlapping on reload
  if (cgpaChartInstance) {
    cgpaChartInstance.destroy();
  }

  cgpaChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['< 7.0 CGPA', '7.0 - 7.9 CGPA', '8.0 - 8.9 CGPA', '9.0+ CGPA'],
      datasets: [{
        label: 'Number of Students',
        data: [rangeBelow7, range7to8, range8to9, rangeAbove9],
        backgroundColor: [
          'rgba(239, 68, 68, 0.75)',  // Red
          'rgba(245, 158, 11, 0.75)', // Amber
          'rgba(59, 130, 246, 0.75)', // Blue
          'rgba(16, 185, 129, 0.75)'  // Green
        ],
        borderColor: [
          '#ef4444',
          '#f59e0b',
          '#3b82f6',
          '#10b981'
        ],
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

/**
 * Placement Readiness Doughnut Chart
 */
let placementChartInstance = null;
function renderPlacementChart(students) {
  const ctx = document.getElementById('placementChart');
  if (!ctx) return;

  if (placementChartInstance) {
    placementChartInstance.destroy();
  }

  placementChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Placed', 'In Process', 'Not Eligible'],
      datasets: [{
        data: [78.5, 15.5, 6.0],
        backgroundColor: [
          '#10b981', // Green
          '#f59e0b', // Amber
          '#6b7280'  // Gray
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 15 }
        }
      },
      cutout: '70%'
    }
  });
}

/**
 * Manual Refresh Action
 */
function reloadDashboardData() {
  const refreshBtn = document.querySelector("button[onclick='reloadDashboardData()']");
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Refreshing...`;
  }

  loadDashboardData().then(() => {
    setTimeout(() => {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i> Refresh Data`;
      }
    }, 500);
  });
}
