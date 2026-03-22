import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function cleanDepartmentNames() {
    await initDB(false);
    
    const departments = await Department.findAll();
    
    for (const dept of departments) {
        // Remove "Second Year 2025-26" and any trailing whitespace
        const oldName = dept.name;
        const newName = oldName.replace(/\s+Second Year\s+\d{4}-\d{2}/g, '').trim();
        
        if (oldName !== newName) {
            console.log(`Updating: "${oldName}" -> "${newName}"`);
            
            // Update students first to maintain consistency
            await Student.update(
                { department: newName },
                { where: { department: oldName } }
            );
            
            // Update department name
            await dept.update({ name: newName });
        }
    }
    
    console.log('✅ Department names cleaned.');
}

cleanDepartmentNames().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
