import { initDB } from './db.js';
import { Department, Student, Faculty, Course } from './models/index.js';

async function mapDepartmentsPartially() {
    await initDB(false);
    
    const depts = await Department.findAll();
    const students = await Student.findAll();
    
    let stuCount = 0;
    for (const s of students) {
        // Find dept that matches the string best
        const match = depts.find(d => 
            s.department.toLowerCase().includes(d.name.toLowerCase()) || 
            d.name.toLowerCase().includes(s.department.toLowerCase()) ||
            s.department.toLowerCase().includes(d.code.toLowerCase())
        );
        
        if (match) {
            await s.update({ departmentId: match.id, department: match.name });
            stuCount++;
        }
    }
    
    console.log(`Synced: ${stuCount} students.`);
    console.log('✅ Interconnection established with partial matching.');
}

mapDepartmentsPartially().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
