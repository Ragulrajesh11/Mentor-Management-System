/**
 * js/github-sync.js
 * Robust GitHub REST API Storage Engine
 */

const GITHUB_CONFIG = {
  owner: 'ragulrajesh11',            // உங்க GitHub Username
  repo: 'Mentor-Management-System', // உங்க Repository Name
  branch: 'main',
  token: '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'
};

/**
 * Upload Image/Document directly to GitHub Repo (/uploads)
 */
async function uploadFileToGitHub(file, studentId) {
  return new Promise((resolve, reject) => {
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
            'Authorization': `token ${GITHUB_CONFIG.token}`,
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
          reject(data);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Save/Update JSON Database in GitHub Repo (/data/students.json)
 */
async function syncStudentsToGitHub(studentsArray) {
  const filePath = 'data/students.json';
  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

  try {
    let sha = '';
    const getRes = await fetch(url, {
      headers: { 'Authorization': `token ${GITHUB_CONFIG.token}` }
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
        'Authorization': `token ${GITHUB_CONFIG.token}`,
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

    const putData = await putRes.json();
    if (!putRes.ok) {
      console.error('GitHub Sync JSON Error:', putData);
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
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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
    const updatedStudents = students.filter(s => s.id !== studentId);
    const success = await syncStudentsToGitHub(updatedStudents);
    return success;
  } catch (err) {
    console.error("Error deleting student from GitHub:", err);
    return false;
  }
}