import { initDB } from './db.js';
import { Student } from './models/index.js';

async function syncStudents() {
    await initDB(false);
    const newDeptName = "B. Tech in Computer Science and Engineering (Data Science) (DS) Second Year 2025-26";
    
    const [count] = await Student.update(
        { department: newDeptName },
        { where: { department: 'Data Science' } }
    );
    
    console.log(`Updated ${count} students to the new department name.`);
}

syncStudents().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
