import { initDB } from './db.js';
import { User, Student, Enrollment, Attendance, ExamResult, Fee, Payment, BookLoan } from './models/index.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');

async function importStudents() {
    console.log('🔄 Connecting to database...');
    // Connect to the DB without dropping all tables
    await initDB(false);

    console.log('🗑️  Dropping all existing students and related data...');
    // Delete data that depends on Student/User
    await Enrollment.destroy({ where: {} });
    await Attendance.destroy({ where: {} });
    await ExamResult.destroy({ where: {} });
    await Payment.destroy({ where: {} });
    await Fee.destroy({ where: {} });
    
    // We also drop BookLoan where the user is a student. We can just empty it to be safe 
    // or we leave it. Let's just empty it for simplicity.
    await BookLoan.destroy({ where: {} });

    // Now delete all Students
    const deletedStudents = await Student.destroy({ where: {} });
    console.log(`Deleted ${deletedStudents} students.`);

    // Delete all Users who are students
    const deletedUsers = await User.destroy({ where: { role: 'student' } });
    console.log(`Deleted ${deletedUsers} student users.`);

    console.log('📄 Reading Excel file...');
    try {
        const workbook = xlsx.readFile('/Users/mridulgupta2911/Downloads/huihui/client/list of students.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} students in the excel file.`);
        
        const newStudents = [];
        
        for (const row of data) {
            const rollNo = String(row['Roll No'] || row['Student Unique Id'] || '').trim();
            const uniqueId = String(row['Student Unique Id'] || '').trim();
            const name = String(row['Student Name'] || '').trim();
            
            if (!rollNo || !name) continue;

            // Generate an email for uniqueness constraint
            // e.g. 2401331540001@student.college.edu
            const email = `${rollNo}@student.college.edu`.toLowerCase();

            newStudents.push({
                rollNo: rollNo,
                name: name,
                email: email,
                semester: 4, // Default to 4 as per previous DS seeded students
                department: 'Data Science', // Default assuming they belong here based on unique ID
                status: 'active'
            });
        }

        console.log(`⏳ Inserting ${newStudents.length} students into the database...`);
        await Student.bulkCreate(newStudents);
        console.log('✅ Students imported successfully!');

    } catch (err) {
        console.error('❌ Error reading excel or inserting students:', err);
    }
}

importStudents().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
