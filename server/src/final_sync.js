import { initDB } from './db.js';
import { Department, Student, Faculty, Course } from './models/index.js';

async function finalSync() {
    await initDB(false);
    
    // Clean up all to match one of the official departments
    const officialDepts = await Department.findAll();
    const dsDept = officialDepts.find(d => d.name.includes('(Data Science)'));
    
    if (dsDept) {
        console.log(`Matching all "Data Science" legacy strings to: "${dsDept.name}"`);
        
        await Student.update({ department: dsDept.name, departmentId: dsDept.id }, { where: { department: 'Data Science' } });
        await Student.update({ department: dsDept.name, departmentId: dsDept.id }, { where: { department: 'B. Tech in Computer Science and Engineering (Data Science)' } });
        
        await Faculty.update({ department: dsDept.name, departmentId: dsDept.id }, { where: { department: 'Data Science' } });
        await Course.update({ department: dsDept.name, departmentId: dsDept.id }, { where: { department: 'Data Science' } });
    }
    
    console.log('✅ Final synchronization done.');
}

finalSync().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
