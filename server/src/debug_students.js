import { initDB } from './db.js';
import { Student } from './models/index.js';

async function checkStudents() {
    await initDB();
    const students = await Student.findAll({ limit: 5 });
    students.forEach(s => {
        console.log(`Student ${s.rollNo}: Dept: ${s.department}, DeptId: ${s.departmentId}`);
    });
}

checkStudents().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
