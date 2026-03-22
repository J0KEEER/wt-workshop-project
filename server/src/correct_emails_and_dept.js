import { initDB, sequelize } from './db.js';
import { Department, Student, Faculty, Course } from './models/index.js';

async function correctData() {
    await initDB(false);
    
    // 1. Correct Emails: rollNo@niet.co.in
    const students = await Student.findAll();
    console.log(`Updating emails for ${students.length} students...`);
    for (const s of students) {
        const newEmail = `${s.rollNo}@niet.co.in`;
        if (s.email !== newEmail) {
            await s.update({ email: newEmail });
        }
    }

    // 2. Correct Dept Name: "B. Tech in Computer Science and Engineering (Data Science & AI)" -> "B. Tech in Computer Science and Engineering (Data Science) (DS)"
    // The user said "data sience branch". I'll use the official name from their previous list.
    const targetDept = await Department.findByPk(1);
    if (targetDept) {
        const oldName = targetDept.name;
        const newName = "B. Tech in Computer Science and Engineering (Data Science) (DS)";
        console.log(`Renaming Dept: "${oldName}" -> "${newName}"`);
        
        await targetDept.update({ name: newName });
        
        // Propagation sync (since I added this logic to the route, I'll repeat it here for existing data)
        await Student.update({ department: newName }, { where: { departmentId: targetDept.id } });
        await Faculty.update({ department: newName }, { where: { departmentId: targetDept.id } });
        await Course.update({ department: newName }, { where: { departmentId: targetDept.id } });
    }

    console.log('✅ Email correction and Department rename completed.');
}

correctData().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
