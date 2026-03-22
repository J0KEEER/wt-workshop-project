import { initDB } from './db.js';
import { Department, Student } from './models/index.js';

async function forceSync() {
    await initDB(false);
    
    // We'll clean official department names first
    const departments = await Department.findAll();
    for (const dept of departments) {
        let newName = dept.name
            .replace(/\s*Second Year\s*/gi, ' ')
            .replace(/\d{4}-\d{2}/g, '')
            .replace(/\s\s+/g, ' ')
            .trim();
        
        if (dept.name !== newName) {
            console.log(`Updating Department: "${dept.name}" -> "${newName}"`);
            await dept.update({ name: newName });
        }
    }
    
    // Now we want to match students to official departments
    // If a student's department field contains part of an official department name, update it.
    const allOfficialDepts = await Department.findAll();
    const students = await Student.findAll();
    
    console.log(`Checking ${students.length} students...`);
    
    for (const student of students) {
        // Try to find a match among official names
        // Heuristic: Remove noise (Second Year, 2025-26, DS etc) from student department and match
        let stuDeptClean = student.department
            .replace(/\s*Second Year\s*/gi, ' ')
            .replace(/\d{4}-\d{2}/g, '')
            .replace(/\(DS\)/gi, '') // Special case from previous import
            .replace(/\s\s+/g, ' ')
            .trim();
            
        // Find official dept that contains the essence of the student's current dept
        const match = allOfficialDepts.find(d => 
            d.name.toLowerCase().includes(stuDeptClean.toLowerCase()) ||
            stuDeptClean.toLowerCase().includes(d.name.toLowerCase())
        );
        
        if (match && student.department !== match.name) {
            // console.log(`Syncing Student Roll ${student.rollNo}: "${student.department}" -> "${match.name}"`);
            await student.update({ department: match.name });
        }
    }
    
    console.log('✅ Force sync completed.');
}

forceSync().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
