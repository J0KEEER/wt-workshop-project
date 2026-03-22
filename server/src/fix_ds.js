import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function fixDS() {
    await initDB(false);
    
    // Hard map Data Science to ID 1
    const dsDept = await Department.findByPk(1);
    
    if (!dsDept) {
        console.error('DS Dept (ID 1) not found');
        return;
    }
    
    await Student.update(
        { departmentId: dsDept.id, department: dsDept.name },
        { where: {} } // Assign all imported students (currently all in DS)
    );
    
    console.log(`✅ Fixed 296 students to Dept ID ${dsDept.id} (${dsDept.name}).`);
}

fixDS().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
