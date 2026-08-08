/**
 * js/auth.js
 * Clean Unified Page Access Guard & Authentication System
 */

const AuthManager = {
  // Admin and Student Login Handler
  login: async function(username, password) {
    // 1. Admin Authentication Check
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('logged_user_role', 'admin');
      sessionStorage.removeItem('current_student');
      return { success: true, role: 'admin' };
    }

    // 2. Student Authentication Check (Fetch from GitHub JSON Database)
    try {
      let students = [];
      if (typeof fetchStudentsFromGitHub === 'function') {
        students = await fetchStudentsFromGitHub() || [];
      }

      // Check if username matches Register No / ID / Student Username
      const student = students.find(s => 
        String(s.id) === String(username) || 
        String(s.regNo) === String(username) || 
        s.username === username
      );

      // Student Default Password is their Mobile Number or RegNo or 'student123'
      if (student) {
        const validPassword = student.studentMobile || student.id || 'student123';
        
        if (password === validPassword || password === 'student123' || password === student.id) {
          sessionStorage.setItem('logged_user_role', 'student');
          sessionStorage.setItem('current_student', JSON.stringify({
            id: student.id || student.regNo,
            username: student.username || student.id,
            name: student.name
          }));
          return { success: true, role: 'student' };
        }
      }
    } catch (err) {
      console.error('Login Auth Error:', err);
    }

    return { success: false, message: 'Invalid Username or Password' };
  },

  // Page Access Guard (Fixed for GitHub Pages Sub-directory Routing)
  checkAccess: function() {
    const currentPath = window.location.pathname.toLowerCase();

    // Allow Public Pages without authentication (Fixes 404 Loop on GitHub Pages)
    if (
      currentPath.endsWith('index.html') || 
      currentPath.endsWith('login.html') || 
      currentPath.endsWith('students.html') || 
      currentPath.endsWith('/') || 
      currentPath === ''
    ) {
      return; // Access allowed
    }

    // Protected Routes Check
    const role = sessionStorage.getItem('logged_user_role');
    if (!role) {
      // Relative Redirect to prevent 404 path issues
      window.location.replace('login.html');
    }
  },

  checkAuth: function() {
    this.checkAccess();
  }
};

// Auto Guard Check Execution on Page Load
AuthManager.checkAccess();
