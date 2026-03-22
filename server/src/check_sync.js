import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function checkSync() {
    await initDB(false);
    
    const officialDepts = await Department.findAll();
    const officialNames = officialDepts.map(d => d.name);
    
    const studentDepts = await Student.findAll({
        attributes: ['department'],
        group: ['department']
    });
    const currentStudentDepts = studentDepts.map(s => s.department);
    
    console.log('--- Official Departments ---');
    console.log(officialNames);
    
    console.log('\n--- Current Student Departments ---');
    console.log(currentStudentDepts);
    
    // Check for mismatches
    const mismatches = currentStudentDepts.filter(name => !officialNames.includes(name));
    if (mismatches.length > 0) {
        console.log('\n❌ MISMATCHES FOUND:');
        console.log(mismatches);
    } else {
        console.log('\n✅ All student departments are synced with official ones.');
    }
}

checkSync().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
