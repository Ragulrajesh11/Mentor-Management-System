/**
 * js/auth.js
 * Clean Unified Page Access Guard
 */

const AuthManager = {
  login: function(username, password) {
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('logged_user_role', 'admin');
      return true;
    }
    return false;
  },

  checkAccess: function() {
    const currentPath = window.location.pathname.toLowerCase();

    // Allow index.html & login.html without authentication
    if (currentPath.endsWith('index.html') || currentPath.endsWith('login.html') || currentPath.endsWith('/')) {
      return; 
    }

    const role = sessionStorage.getItem('logged_user_role');
    if (!role) {
      window.location.replace('index.html');
    }
  },

  checkAuth: function() {
    this.checkAccess();
  }
};

// Auto Guard Check Execution
AuthManager.checkAccess();