import { initDB } from './db.js';
import { Department, Student, Faculty, Course } from './models/index.js';

async function mapDepartments() {
    await initDB(false);
    
    const depts = await Department.findAll();
    const deptMap = {};
    depts.forEach(d => {
        deptMap[d.name.toLowerCase()] = d.id;
    });
    
    // 1. Sync Students
    const students = await Student.findAll();
    let stuCount = 0;
    for (const s of students) {
        const dId = deptMap[s.department.toLowerCase()];
        if (dId) {
            await s.update({ departmentId: dId });
            stuCount++;
        }
    }
    
    // 2. Sync Faculty
    const faculties = await Faculty.findAll();
    let facCount = 0;
    for (const f of faculties) {
        const dId = deptMap[f.department.toLowerCase()];
        if (dId) {
            await f.update({ departmentId: dId });
            facCount++;
        }
    }
    
    // 3. Sync Courses
    const courses = await Course.findAll();
    let crsCount = 0;
    for (const c of courses) {
        const dId = deptMap[c.department.toLowerCase()];
        if (dId) {
            await c.update({ departmentId: dId });
            crsCount++;
        }
    }
    
    console.log(`Synced: ${stuCount} students, ${facCount} faculty, ${crsCount} courses.`);
    console.log('✅ Interconnection established.');
}

mapDepartments().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
