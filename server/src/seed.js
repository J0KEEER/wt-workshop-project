import { initDB } from './db.js';
import { User, Student, Faculty, Course, Enrollment, Attendance, Exam, ExamResult, Fee, Book, BookLoan } from './models/index.js';

async function seed() {
    console.log('🌱 Seeding database...');
    await initDB(true); // force: true drops all tables

    // --- Users ---
    const admin = await User.create({ username: 'admin', email: 'admin@college.edu', passwordHash: 'admin123', firstName: 'Admin', lastName: 'User', role: 'admin' });
    const lib = await User.create({ username: 'librarian', email: 'librarian@college.edu', passwordHash: 'lib123', firstName: 'Sarah', lastName: 'Lib', role: 'librarian' });

    const facUsers = [];
    const facData = [
        { username: 'dr.smith', email: 'smith@college.edu', firstName: 'John', lastName: 'Smith' },
        { username: 'dr.jones', email: 'jones@college.edu', firstName: 'Emily', lastName: 'Jones' },
        { username: 'dr.patel', email: 'patel@college.edu', firstName: 'Raj', lastName: 'Patel' },
    ];
    for (const f of facData) {
        const u = await User.create({ ...f, passwordHash: 'fac123', role: 'faculty' });
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
        const u = await User.create({ ...s, passwordHash: 'stu123', role: 'student' });
        stuUsers.push(u);
    }

    // --- Faculty ---
    const departments = ['Computer Science', 'Mathematics', 'Physics'];
    const designations = ['Professor', 'Associate Professor', 'Assistant Professor'];
    const faculties = [];
    for (let i = 0; i < facUsers.length; i++) {
        const fac = await Faculty.create({
            userId: facUsers[i].id,
            name: `${facUsers[i].firstName} ${facUsers[i].lastName}`,
            email: facUsers[i].email,
            department: departments[i],
            designation: designations[i],
            phone: `555-010${i}`,
            joiningDate: '2020-01-15',
        });
        faculties.push(fac);
    }

    // --- Students ---
    const students = [];
    for (let i = 0; i < stuUsers.length; i++) {
        const s = await Student.create({
            userId: stuUsers[i].id,
            rollNo: `CS${2024}${String(i + 1).padStart(3, '0')}`,
            name: `${stuUsers[i].firstName} ${stuUsers[i].lastName}`,
            email: stuUsers[i].email,
            dob: `200${Math.floor(i / 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            phone: `555-020${String(i).padStart(2, '0')}`,
            semester: (i % 4) + 1,
            department: departments[i % 3],
            guardianName: `Guardian of ${stuUsers[i].firstName}`,
            admissionDate: '2024-08-01',
        });
        students.push(s);
    }

    // --- Courses ---
    const courseData = [
        { code: 'CS101', title: 'Introduction to Programming', credits: 4, semester: 1, department: 'Computer Science', capacity: 60 },
        { code: 'CS201', title: 'Data Structures & Algorithms', credits: 4, semester: 2, department: 'Computer Science', capacity: 50 },
        { code: 'CS301', title: 'Database Systems', credits: 3, semester: 3, department: 'Computer Science', capacity: 45 },
        { code: 'MA101', title: 'Calculus I', credits: 3, semester: 1, department: 'Mathematics', capacity: 60 },
        { code: 'MA201', title: 'Linear Algebra', credits: 3, semester: 2, department: 'Mathematics', capacity: 50 },
        { code: 'PH101', title: 'Mechanics', credits: 3, semester: 1, department: 'Physics', capacity: 55 },
        { code: 'CS401', title: 'Artificial Intelligence', credits: 4, semester: 4, department: 'Computer Science', capacity: 40 },
        { code: 'MA301', title: 'Probability & Statistics', credits: 3, semester: 3, department: 'Mathematics', capacity: 45 },
    ];
    const courses = [];
    for (let i = 0; i < courseData.length; i++) {
        const c = await Course.create({ ...courseData[i], facultyId: faculties[i % faculties.length].id });
        courses.push(c);
    }

    // --- Enrollments ---
    for (let i = 0; i < students.length; i++) {
        // Each student enrolls in 3-4 courses
        const indices = [i % courses.length, (i + 1) % courses.length, (i + 2) % courses.length];
        if (i % 3 === 0) indices.push((i + 3) % courses.length);
        for (const ci of indices) {
            await Enrollment.create({
                studentId: students[i].id,
                courseId: courses[ci].id,
                term: '2024-Spring',
                enrollmentDate: '2024-01-15',
            });
        }
    }

    // --- Attendance (last 10 days for first 2 courses) ---
    const today = new Date();
    for (let d = 0; d < 10; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];

        for (let ci = 0; ci < 2; ci++) {
            const enrollments = await Enrollment.findAll({ where: { courseId: courses[ci].id, status: 'active' } });
            for (const enr of enrollments) {
                const statuses = ['present', 'present', 'present', 'present', 'absent', 'late'];
                await Attendance.create({
                    studentId: enr.studentId,
                    courseId: courses[ci].id,
                    date: dateStr,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    markedBy: faculties[ci].userId,
                });
            }
        }
    }

    // --- Exams ---
    const examData = [
        { courseId: courses[0].id, title: 'CS101 Midterm', type: 'midterm', totalMarks: 100, term: '2024-Spring' },
        { courseId: courses[0].id, title: 'CS101 Quiz 1', type: 'quiz', totalMarks: 20, term: '2024-Spring' },
        { courseId: courses[1].id, title: 'CS201 Midterm', type: 'midterm', totalMarks: 100, term: '2024-Spring' },
        { courseId: courses[3].id, title: 'MA101 Final', type: 'final', totalMarks: 100, term: '2024-Spring' },
    ];
    const exams = [];
    for (let i = 0; i < examData.length; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + (i + 1) * 7);
        const e = await Exam.create({ ...examData[i], date: futureDate.toISOString().split('T')[0] });
        exams.push(e);
    }

    // Add results for the first exam
    const enrolled0 = await Enrollment.findAll({ where: { courseId: courses[0].id } });
    for (const enr of enrolled0) {
        const marks = Math.floor(Math.random() * 60) + 40;
        const pct = marks;
        let grade = 'C';
        if (pct >= 90) grade = 'A+'; else if (pct >= 80) grade = 'A'; else if (pct >= 70) grade = 'B+'; else if (pct >= 60) grade = 'B'; else if (pct >= 50) grade = 'C'; else if (pct >= 40) grade = 'D'; else grade = 'F';
        await ExamResult.create({ examId: exams[0].id, studentId: enr.studentId, marksObtained: marks, grade });
    }

    // --- Fees ---
    for (const s of students) {
        await Fee.create({ studentId: s.id, description: 'Tuition Fee - Spring 2024', type: 'tuition', amount: 5000, dueDate: '2024-03-15', status: Math.random() > 0.3 ? 'paid' : 'pending', paidAmount: Math.random() > 0.3 ? 5000 : 0, term: '2024-Spring' });
        await Fee.create({ studentId: s.id, description: 'Library Fee - Spring 2024', type: 'library', amount: 200, dueDate: '2024-03-15', status: 'paid', paidAmount: 200, term: '2024-Spring' });
        if (Math.random() > 0.5) {
            await Fee.create({ studentId: s.id, description: 'Lab Fee - Spring 2024', type: 'laboratory', amount: 500, dueDate: '2024-04-01', status: 'pending', paidAmount: 0, term: '2024-Spring' });
        }
    }

    // --- Library Books ---
    const bookData = [
        { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', isbn: '978-0262033848', category: 'textbook', totalCopies: 5, availableCopies: 3, publisher: 'MIT Press', year: 2009, location: 'A-101' },
        { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'reference', totalCopies: 3, availableCopies: 2, publisher: 'Prentice Hall', year: 2008, location: 'A-102' },
        { title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0201633610', category: 'reference', totalCopies: 2, availableCopies: 1, publisher: 'Addison-Wesley', year: 1994, location: 'A-103' },
        { title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '978-1285741550', category: 'textbook', totalCopies: 8, availableCopies: 6, publisher: 'Cengage', year: 2015, location: 'B-201' },
        { title: 'Physics for Scientists', author: 'Serway & Jewett', isbn: '978-1337553278', category: 'textbook', totalCopies: 6, availableCopies: 4, publisher: 'Cengage', year: 2018, location: 'B-202' },
        { title: 'Database System Concepts', author: 'Silberschatz, Korth, Sudarshan', isbn: '978-0078022159', category: 'textbook', totalCopies: 4, availableCopies: 3, publisher: 'McGraw-Hill', year: 2019, location: 'A-104' },
        { title: 'Artificial Intelligence: A Modern Approach', author: 'Russell & Norvig', isbn: '978-0134610993', category: 'textbook', totalCopies: 3, availableCopies: 2, publisher: 'Pearson', year: 2020, location: 'A-105' },
        { title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', isbn: '978-0135957059', category: 'reference', totalCopies: 3, availableCopies: 3, publisher: 'Addison-Wesley', year: 2019, location: 'A-106' },
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
    console.log('  Admin:     admin / admin123');
    console.log('  Faculty:   dr.smith / fac123  |  dr.jones / fac123  |  dr.patel / fac123');
    console.log('  Students:  alice / stu123  |  bob / stu123  |  charlie / stu123  ...');
    console.log('  Librarian: librarian / lib123');
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
