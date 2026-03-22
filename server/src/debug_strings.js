import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function logStrings() {
    await initDB();
    const s = await Student.findOne();
    const d = await Department.findOne();
    console.log('Student Dept: [' + s?.department + ']');
    console.log('Dept Name: [' + d?.name + ']');
    
    // Test a match
    const match = d?.name?.toLowerCase().includes('data science') || s?.department?.toLowerCase().includes('data science');
    console.log('Has Data Science? ' + match);
}

logStrings().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
