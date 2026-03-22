import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function logDepts() {
    await initDB();
    const departments = await Department.findAll({ 
        include: [
            { model: Student, as: 'students', attributes: ['id'] }
        ]
    });
    
    departments.forEach(d => {
        console.log(`- ${d.name}: students: ${d.students?.length}`);
    });
}

logDepts().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
