/**
 * js/github-sync.js
 * Secure GitHub REST API Storage Engine with System Fallback Token
 */

// SYSTEM BACKUP TOKEN (Allows Public Students to Register without Prompt)
// Replace 'ghp_YOUR_ACTUAL_GITHUB_TOKEN_HERE' with your real GitHub Personal Access Token
const HARDCODED_SYSTEM_TOKEN = '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';

// Function to retrieve Token automatically without disturbing public users
function getGitHubToken() {
  let token = localStorage.getItem('gh_portal_token');
  
  // If no token in user's browser, use the System Hardcoded Token as Fallback
  if (!token || token.trim() === '') {
    token = HARDCODED_SYSTEM_TOKEN;
    localStorage.setItem('gh_portal_token', token);
  }
  return token;
}

// Function to allow Admin to update Token dynamically if needed
function setGitHubToken(newToken) {
  if (newToken) {
    localStorage.setItem('gh_portal_token', newToken.trim());
    alert("GitHub Access Token updated successfully!");
  }
}

const GITHUB_CONFIG = {
  owner: 'ragulrajesh11',            // GitHub Username
  repo: 'Mentor-Management-System', // Repository Name
  branch: 'main',
  get token() {
    return getGitHubToken();
  }
};

/**
 * Upload Image/Document directly to GitHub Repo (/uploads)
 */
async function uploadFileToGitHub(file, studentId) {
  return new Promise((resolve, reject) => {
    const token = GITHUB_CONFIG.token;
    if (!token) {
      alert("GitHub Token configuration missing!");
      return reject("No Token Provided");
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      try {
        const base64Content = reader.result.split(',')[1];
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${studentId}_${Date.now()}_${cleanFileName}`;
        const filePath = `uploads/${fileName}`;

        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `upload: Document for ${studentId}`,
            content: base64Content,
            branch: GITHUB_CONFIG.branch
          })
        });

        const data = await response.json();
        if (response.ok) {
          resolve(data.content.download_url);
        } else {
          console.error('GitHub API File Upload Error:', data);
          if (response.status === 401) {
            localStorage.removeItem('gh_portal_token');
            alert('Invalid Token. Restoring system backup...');
          }
          reject(data);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
  });
}

// Alias for students.html compatibility
async function uploadDocumentToGitHub(file, studentId) {
  return await uploadFileToGitHub(file, studentId);
}

/**
 * Save/Update JSON Database in GitHub Repo (/data/students.json)
 */
async function syncStudentsToGitHub(studentsArray) {
  const token = GITHUB_CONFIG.token;
  if (!token) {
    alert("GitHub Token configuration missing!");
    return false;
  }

  const filePath = 'data/students.json';
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

  try {
    let sha = '';
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${token}` }
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const jsonString = JSON.stringify(studentsArray, null, 2);
    const base64Json = btoa(unescape(encodeURIComponent(jsonString)));

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'data: Sync student record data',
        content: base64Json,
        sha: sha !== '' ? sha : undefined,
        branch: GITHUB_CONFIG.branch
      })
    });

    if (!putRes.ok && putRes.status === 401) {
      localStorage.removeItem('gh_portal_token');
    }

    return putRes.ok;
  } catch (err) {
    console.error('GitHub Sync Exception:', err);
    return false;
  }
}

/**
 * Fetch Students Data from GitHub Repo
 */
async function fetchStudentsFromGitHub() {
  const filePath = 'data/students.json';
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const jsonContent = decodeURIComponent(escape(atob(data.content)));
      return JSON.parse(jsonContent);
    }
  } catch (e) {
    console.warn('GitHub API fetch failed:', e);
  }
  return [];
}

/**
 * Delete a Student by ID from GitHub JSON Database
 */
async function deleteStudentFromGitHub(studentId) {
  try {
    let students = await fetchStudentsFromGitHub() || [];
    const updatedStudents = students.filter(s => String(s.id) !== String(studentId));
    const success = await syncStudentsToGitHub(updatedStudents);
    return success;
  } catch (err) {
    console.error("Error deleting student from GitHub:", err);
    return false;
  }
}
