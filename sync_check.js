import { initDB } from './server/src/db.js';
import { User, Faculty, LeaveRequest, Payroll } from './server/src/models/index.js';

async function syncCheck() {
  try {
    await initDB();
    console.log('✅ Models synced successfully');
    
    // Check if new fields exist
    const facultyAttributes = Object.keys(Faculty.getAttributes());
    const userAttributes = Object.keys(User.getAttributes());
    
    if (facultyAttributes.includes('baseSalary')) {
      console.log('✅ Faculty baseSalary field exists');
    } else {
      console.log('❌ Faculty baseSalary field MISSING');
    }
    
    if (userAttributes.includes('baseSalary')) {
      console.log('✅ User baseSalary field exists');
    } else {
      console.log('❌ User baseSalary field MISSING');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync check failed:', err);
    process.exit(1);
  }
}

syncCheck();
