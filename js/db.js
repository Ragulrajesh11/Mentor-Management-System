/**
 * IndexedDB Database Engine with LocalStorage Fallback
 */
const DB_NAME = 'MentorSystemDB';
const DB_VERSION = 1;

class StorageEngine {
  constructor() {
    this.db = null;
    this.isIDBSupported = 'indexedDB' in window;
  }

  async init() {
    if (!this.isIDBSupported) {
      console.warn('IndexedDB unavailable. Using LocalStorage fallback.');
      this.seedInitialDataIfEmpty();
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('students')) {
          db.createObjectStore('students', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('attendance')) {
          db.createObjectStore('attendance', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('marks')) {
          db.createObjectStore('marks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meetings')) {
          db.createObjectStore('meetings', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        this.seedInitialDataIfEmpty().then(resolve);
      };

      request.onerror = (e) => {
        console.error('IndexedDB Error:', e);
        reject(e);
      };
    });
  }

  async getAll(storeName) {
    if (!this.db) {
      return JSON.parse(localStorage.getItem(storeName) || '[]');
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, data) {
    if (!this.db) {
      const items = await this.getAll(storeName);
      const idx = items.findIndex(i => i.id === data.id);
      if (idx >= 0) items[idx] = data;
      else items.push(data);
      localStorage.setItem(storeName, JSON.stringify(items));
      return data;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(data);
      req.onerror = () => reject(req.error);
    });
  }

  async seedInitialDataIfEmpty() {
    const existing = await this.getAll('students');
    if (existing && existing.length > 0) return;

    // Generate ~60 Realistic Students
    const departments = ['Computer Science', 'Information Technology', 'Electronics & Comm', 'Mechanical'];
    const names = [
      'Aarav Sharma', 'Ananya Patel', 'Rohan Gupta', 'Isha Verma', 'Aditya Nair',
      'Diya Reddy', 'Siddharth Joshi', 'Kavya Iyer', 'Vihaan Rao', 'Pari Choudhury',
      'Kabir Mehta', 'Riya Sen', 'Arjun Kapoor', 'Tanvi Bhat', 'Devansh Pillai',
      'Anushka Banerjee', 'Krishna Das', 'Sneha Ganguly', 'Yash Saxena', 'Tara Kulkarni'
    ];

    const generatedStudents = [];
    for (let i = 1; i <= 60; i++) {
      const baseName = names[(i - 1) % names.length];
      const dept = departments[i % departments.length];
      const gpa = (6.5 + (i * 0.05) % 3.4).toFixed(2);
      const attendance = Math.floor(70 + (i * 3.7) % 28);
      
      generatedStudents.push({
        id: `STU-2026-${100 + i}`,
        name: `${baseName} ${i > 20 ? i : ''}`.trim(),
        email: `student${i}@college.edu`,
        department: dept,
        year: (i % 4) + 1,
        cgpa: parseFloat(gpa),
        attendancePct: attendance,
        placementStatus: attendance > 80 && gpa > 7.5 ? 'Placed' : (gpa > 6.5 ? 'Eligible' : 'Ineligible'),
        skills: ['JavaScript', 'Python', 'SQL', 'Data Structures'].slice(0, (i % 4) + 1),
        documentsVerified: i % 5 !== 0
      });
    }

    for (const student of generatedStudents) {
      await this.put('students', student);
    }
    console.log('Seeded 60 student records into Database.');
  }
}

const dbEngine = new StorageEngine();