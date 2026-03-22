import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function tryOne() {
    await initDB();
    const s = await Student.findOne();
    if (!s) return;
    
    console.log('Old DeptId: ' + s.departmentId);
    try {
        s.departmentId = 1;
        await s.save();
        console.log('Saved success. New DeptId: ' + s.departmentId);
    } catch (err) {
        console.error('Save failed:', err);
    }
}

tryOne().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
