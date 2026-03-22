import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function testRename() {
    await initDB();
    const d = await Department.findByPk(1);
    const oldName = d.name;
    const newName = "Computer Science (Data Science & AI)";
    
    console.log(`Renaming: "${oldName}" -> "${newName}"`);
    
    // We simulate the PUT route logic
    await d.update({ name: newName });
    await Student.update({ department: newName }, { where: { departmentId: d.id } });
    
    const s = await Student.findOne({ where: { departmentId: d.id } });
    console.log(`Student ${s.rollNo} department string: "${s.department}"`);
    
    if (s.department === newName) {
        console.log('✅ SYNC SUCCESSFUL');
    } else {
        console.log('❌ SYNC FAILED');
    }
}

testRename().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
