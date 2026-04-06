import { initDB } from './db.js';
import { User, Student, Faculty, Course, Enrollment, Attendance, Exam, ExamResult, Fee, Book, BookLoan } from './models/index.js';

// Seed passwords from environment or use secure defaults
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe_Admin1!';
const DEFAULT_LIBRARIAN_PASSWORD = process.env.SEED_LIBRARIAN_PASSWORD || 'ChangeMe_Lib1!';
const DEFAULT_FACULTY_PASSWORD = process.env.SEED_FACULTY_PASSWORD || 'ChangeMe_Fac1!';
const DEFAULT_STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'ChangeMe_Stu1!';

async function seed() {
    console.log('🌱 Seeding database...');
    // force: true drops tables and recreates them entirely, removing all previous data as requested
    await initDB(true);

    // --- Users ---
    const admin = await User.create({ username: 'admin', email: 'admin@college.edu', passwordHash: DEFAULT_ADMIN_PASSWORD, firstName: 'Admin', lastName: 'User', role: 'admin' });
    const lib = await User.create({ username: 'librarian', email: 'librarian@college.edu', passwordHash: DEFAULT_LIBRARIAN_PASSWORD, firstName: 'Sarah', lastName: 'Lib', role: 'librarian' });

    const facUsers = [];
    // Faculties derived from the images for B.Tech CSE (Data Science)
    const facData = [
        { username: 'shivangi', email: 'shivangi@niet.edu', firstName: 'Shivangi', lastName: '' },
        { username: 'sakshi', email: 'sakshi@niet.edu', firstName: 'Sakshi', lastName: '' },
        { username: 'amita.pathania', email: 'amita.pathania@niet.edu', firstName: 'Amita', lastName: 'Pathania' },
        { username: 'smriti', email: 'smriti@niet.edu', firstName: 'Smriti', lastName: '' },
        { username: 'archit', email: 'archit@niet.edu', firstName: 'Archit', lastName: '' },
        { username: 'garima', email: 'garima@niet.edu', firstName: 'Garima', lastName: '' },
        { username: 'honey.singh', email: 'honey.singh@niet.edu', firstName: 'Honey', lastName: 'Singh' },
        { username: 'suman', email: 'suman@niet.edu', firstName: 'Suman', lastName: '' },
        { username: 'rachna', email: 'rachna@niet.edu', firstName: 'Rachna', lastName: '' },
        { username: 'sover.bisht', email: 'sover.bisht@niet.edu', firstName: 'Sover Singh', lastName: 'Bisht' },
        { username: 'manisha', email: 'manisha@niet.edu', firstName: 'Manisha', lastName: '' },
        { username: 'divi', email: 'divi@niet.edu', firstName: 'Divi', lastName: '' },
        { username: 'shiv', email: 'shiv@niet.edu', firstName: 'Shiv', lastName: '' },
        { username: 'utkarsh', email: 'utkarsh@niet.edu', firstName: 'Utkarsh', lastName: '' },
        { username: 'preeti.singh', email: 'preeti.singh@niet.edu', firstName: 'Preeti', lastName: 'Singh' },
        { username: 'nisha', email: 'nisha@niet.edu', firstName: 'Nisha', lastName: '' },
        { username: 'nidhi.sharma', email: 'nidhi.sharma@niet.edu', firstName: 'Nidhi', lastName: 'Sharma' },
        { username: 'chandrapal.singh', email: 'chandrapal.singh@niet.edu', firstName: 'Chandrapal', lastName: 'Singh' },
        { username: 'shormita', email: 'shormita@niet.edu', firstName: 'Shormita', lastName: '' },
        { username: 'saurabh.srivastava', email: 'saurabh.srivastava@niet.edu', firstName: 'Saurabh', lastName: 'Srivastava' },
    ];
    for (const f of facData) {
        const u = await User.create({ ...f, passwordHash: DEFAULT_FACULTY_PASSWORD, role: 'faculty' });
        facUsers.push(u);
    }

    const stuUsers = [];
    const stuData = [
        { username: 'alice', email: 'alice@student.edu', firstName: 'Alice', lastName: 'Johnson' },
        { username: 'bob', email: 'bob@student.edu', firstName: 'Bob', lastName: 'Williams' },
        { username: 'charlie', email: 'charlie@student.edu', firstName: 'Charlie', lastName: 'Brown' },
        { username: 'diana', email: 'diana@student.edu', firstName: 'Diana', lastName: 'Davis' },
        { username: 'evan', email: 'evan@student.edu', firstName: 'Evan', lastName: 'Miller' },
        { username: 'fiona', email: 'fiona@student.edu', firstName: 'Fiona', lastName: 'Wilson' },
        { username: 'george', email: 'george@student.edu', firstName: 'George', lastName: 'Moore' },
        { username: 'hannah', email: 'hannah@student.edu', firstName: 'Hannah', lastName: 'Taylor' },
        { username: 'ivan', email: 'ivan@student.edu', firstName: 'Ivan', lastName: 'Anderson' },
        { username: 'julia', email: 'julia@student.edu', firstName: 'Julia', lastName: 'Thomas' },
    ];
    for (const s of stuData) {
        const u = await User.create({ ...s, passwordHash: DEFAULT_STUDENT_PASSWORD, role: 'student' });
        stuUsers.push(u);
    }

    // --- Faculty Profiles ---
    const faculties = [];
    for (let i = 0; i < facUsers.length; i++) {
        const facName = facUsers[i].lastName ? `${facUsers[i].firstName} ${facUsers[i].lastName}` : facUsers[i].firstName;
        const fac = await Faculty.create({
            userId: facUsers[i].id,
            name: facName,
            email: facUsers[i].email,
            department: 'Data Science',
            designation: 'Assistant Professor',
            phone: `555-010${i}`,
            joiningDate: '2020-01-15',
        });
        faculties.push(fac);
    }

    // --- Students Profiles ---
    const students = [];
    for (let i = 0; i < stuUsers.length; i++) {
        const s = await Student.create({
            userId: stuUsers[i].id,
            rollNo: `CS${2024}${String(i + 1).padStart(3, '0')}`,
            name: `${stuUsers[i].firstName} ${stuUsers[i].lastName}`,
            email: stuUsers[i].email,
            dob: `200${Math.floor(i / 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            phone: `555-020${String(i).padStart(2, '0')}`,
            semester: 4,
            department: 'Data Science',
            guardianName: `Guardian of ${stuUsers[i].firstName}`,
            admissionDate: '2024-08-01',
        });
        students.push(s);
    }

    // --- Courses ---
    // Subjects derived from the images for B.Tech CSE (Data Science) - Semester IV
    const courseData = [
        { code: 'BCSE0455',     title: 'Web Technologies', abbreviation: 'SVG/AMP/ARC', credits: 4, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'shivangi' },
        { code: 'BCSE0402',     title: 'Database Management System', abbreviation: 'HS/PS/NS', credits: 4, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'honey.singh' },
        { code: 'BCSE0401',     title: 'Data Structure and Algorithms-II', abbreviation: 'SMN/CSP', credits: 4, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'suman' },
        { code: 'BCSDS0412/11', title: 'BIDV/DJANGO', abbreviation: 'RCS/SSB/MPS', credits: 4, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'rachna' },
        { code: 'BASL0401N',    title: 'Technical Communication', abbreviation: 'Divi/Shiv/Shormita', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'divi' },
        { code: 'BCSML0401',    title: 'Machine Learning', abbreviation: 'UTK/NS', credits: 4, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'utkarsh' },
        { code: 'BNC0401/2Y',   title: 'AI & Cyber Ethics', abbreviation: 'SMR/SVG/UTK', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'smriti' },
        { code: 'BCSE0452Z',    title: 'DBMS LAB', abbreviation: 'DBMS LAB', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'preeti.singh' },
        { code: 'BCSE0451',     title: 'DSA LAB', abbreviation: 'DSA LAB', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'chandrapal.singh' },
        { code: 'BCSE0459',     title: 'MINI PROJECT', abbreviation: 'MINI PROJECT', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'archit' },
        { code: 'BCSCC0452',    title: 'PROBLEM SOLVING', abbreviation: 'PROBLEM SOLVING', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'sakshi' },
        { code: 'BASCCO401',    title: 'ESD', abbreviation: 'ESD', credits: 2, semester: 4, department: 'Data Science', capacity: 60, facHandle: 'amita.pathania' }
    ];

    const courses = [];
    for (let cData of courseData) {
        // Find the faculty id based on facHandle
        const user = facUsers.find(u => u.username === cData.facHandle);
        const fac = faculties.find(f => f.userId === user.id);
        
        const { code, title, credits, semester, department, capacity } = cData;
        const c = await Course.create({ code, title, credits, semester, department, capacity, facultyId: fac.id });
        courses.push(c);
    }

    // --- Enrollments ---
    // Enroll all students in all courses to properly seed attendance and exam tabs
    for (let i = 0; i < students.length; i++) {
        for (let j = 0; j < courses.length; j++) {
            await Enrollment.create({
                studentId: students[i].id,
                courseId: courses[j].id,
                term: '2025-Even', // matching the 2025-26 timetable
                enrollmentDate: '2025-01-15',
                status: 'active'
            });
        }
    }

    // --- Attendance (last 10 days for all courses) ---
    const today = new Date();
    for (let d = 0; d < 10; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0];

        // Generate attendance for all courses
        for (let ci = 0; ci < courses.length; ci++) {
            const enrollments = await Enrollment.findAll({ where: { courseId: courses[ci].id, status: 'active' } });
            
            // Randomly mark attendance
            for (const enr of enrollments) {
                const isPresent = Math.random() > 0.2; // 80% attendance chance
                await Attendance.create({
                    studentId: enr.studentId,
                    courseId: courses[ci].id,
                    date: dateStr,
                    status: isPresent ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
                    markedBy: courses[ci].facultyId, // just using the standard facultyId for this course
                });
            }
        }
    }

    // --- Exams ---
    const exams = [];
    for (let i = 0; i < courses.length; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + 14); // 2 weeks from now
        
        // one past exam and one future exam for variety
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - 20); // 20 days ago
        
        const pastExam = await Exam.create({
            courseId: courses[i].id,
            title: `${courses[i].code} Midterm`,
            type: 'midterm',
            totalMarks: 50,
            term: '2025-Even',
            date: pastDate.toISOString().split('T')[0]
        });
        
        const futureExam = await Exam.create({
            courseId: courses[i].id,
            title: `${courses[i].code} Final`,
            type: 'final',
            totalMarks: 100,
            term: '2025-Even',
            date: date.toISOString().split('T')[0]
        });
        
        exams.push(pastExam, futureExam);
        
        // Add results for the past exam
        const enrollments = await Enrollment.findAll({ where: { courseId: courses[i].id } });
        for (const enr of enrollments) {
            const marks = Math.floor(Math.random() * 25) + 25; // Random marks between 25 and 50
            const pct = (marks / 50) * 100;
            let grade = 'C';
            if (pct >= 90) grade = 'A+'; else if (pct >= 80) grade = 'A'; else if (pct >= 70) grade = 'B+'; else if (pct >= 60) grade = 'B'; else if (pct >= 50) grade = 'C'; else if (pct >= 40) grade = 'D'; else grade = 'F';
            
            await ExamResult.create({
                examId: pastExam.id,
                studentId: enr.studentId,
                marksObtained: marks,
                grade
            });
        }
    }

    // --- Fees ---
    for (const s of students) {
        await Fee.create({ studentId: s.id, description: 'Tuition Fee - Even 2025', type: 'tuition', amount: 5000, dueDate: '2025-03-15', status: Math.random() > 0.3 ? 'paid' : 'pending', paidAmount: Math.random() > 0.3 ? 5000 : 0, term: '2025-Even' });
        await Fee.create({ studentId: s.id, description: 'Library Fee - Even 2025', type: 'library', amount: 200, dueDate: '2025-03-15', status: 'paid', paidAmount: 200, term: '2025-Even' });
        if (Math.random() > 0.5) {
            await Fee.create({ studentId: s.id, description: 'Lab Fee - Even 2025', type: 'laboratory', amount: 500, dueDate: '2025-04-01', status: 'pending', paidAmount: 0, term: '2025-Even' });
        }
    }

    // --- Library Books ---
    const bookData = [
        { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', isbn: '978-0262033848', category: 'textbook', totalCopies: 5, availableCopies: 3, publisher: 'MIT Press', year: 2009, location: 'A-101' },
        { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'reference', totalCopies: 3, availableCopies: 2, publisher: 'Prentice Hall', year: 2008, location: 'A-102' },
        { title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0201633610', category: 'reference', totalCopies: 2, availableCopies: 1, publisher: 'Addison-Wesley', year: 1994, location: 'A-103' },
        { title: 'Machine Learning', author: 'Tom Mitchell', isbn: '978-0070428072', category: 'textbook', totalCopies: 8, availableCopies: 6, publisher: 'McGraw-Hill', year: 1997, location: 'B-201' },
        { title: 'Web Development with Node & Express', author: 'Ethan Brown', isbn: '978-1491949306', category: 'textbook', totalCopies: 6, availableCopies: 4, publisher: 'OReilly', year: 2014, location: 'B-202' },
        { title: 'Database System Concepts', author: 'Silberschatz, Korth, Sudarshan', isbn: '978-0078022159', category: 'textbook', totalCopies: 4, availableCopies: 3, publisher: 'McGraw-Hill', year: 2019, location: 'A-104' },
    ];
    for (const b of bookData) {
        await Book.create(b);
    }

    // A couple of book loans
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14);
    await BookLoan.create({ bookId: 1, userId: stuUsers[0].id, borrowDate: today.toISOString().split('T')[0], dueDate: dueDate.toISOString().split('T')[0] });
    await BookLoan.create({ bookId: 2, userId: stuUsers[1].id, borrowDate: today.toISOString().split('T')[0], dueDate: dueDate.toISOString().split('T')[0] });

    console.log('✅ Seed complete!');
    console.log('\n📋 Login credentials:');
    console.log('  Admin:     admin / ' + DEFAULT_ADMIN_PASSWORD);
    console.log('  Faculty:   shivangi / ' + DEFAULT_FACULTY_PASSWORD + '  |  honey.singh / ' + DEFAULT_FACULTY_PASSWORD);
    console.log('  Students:  alice / ' + DEFAULT_STUDENT_PASSWORD + '  |  bob / ' + DEFAULT_STUDENT_PASSWORD + ' ...');
    console.log('  Librarian: librarian / ' + DEFAULT_LIBRARIAN_PASSWORD);
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
