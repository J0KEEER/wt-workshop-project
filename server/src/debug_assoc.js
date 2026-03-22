import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function testAssoc() {
    await initDB();
    const dept = await Department.findByPk(1, {
        include: [{ model: Student, as: 'students' }]
    });
    console.log(`Dept ${dept.id} (${dept.name}): students found via include: ${dept.students?.length}`);
    
    const studentsRaw = await Student.findAll({ where: { departmentId: 1 } });
    console.log(`Students with departmentId=1 found via direct query: ${studentsRaw.length}`);
}

testAssoc().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
