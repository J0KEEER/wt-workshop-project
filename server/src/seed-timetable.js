/**
 * Seed script — NIET BTech CSE (Data Science) Sem IV
 * Replaces ALL existing courses & faculty with timetable data
 * from Sections A, B, C, D (EVEN Semester 2025-26)
 *
 * Run:  node src/seed-timetable.js
 */

const { sequelize } = require('./db');
const { Course, Faculty, Enrollment, Attendance, Exam, ExamResult } = require('./models');

async function seed() {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // ─── 1. Clear dependent tables first (FK constraints) ───
    console.log('🗑️  Clearing old data...');
    await ExamResult.destroy({ where: {} });
    await Exam.destroy({ where: {} });
    await Attendance.destroy({ where: {} });
    await Enrollment.destroy({ where: {} });
    await Course.destroy({ where: {} });
    await Faculty.destroy({ where: {} });
    console.log('   Done — old courses, faculty, and related data cleared.');

    // ─── 2. Seed Faculty ───
    console.log('👩‍🏫 Seeding faculty...');
    const facultyData = [
        { name: 'Ms. Shivangi',             email: 'shivangi@niet.co.in',           department: 'Data Science', designation: 'Assistant Professor', specialization: 'Web Technologies' },
        { name: 'Ms. Sakshi',               email: 'sakshi@niet.co.in',             department: 'Data Science', designation: 'Assistant Professor', specialization: 'Web Technologies' },
        { name: 'Ms. Amita Pathania',       email: 'amita.pathania@niet.co.in',     department: 'Data Science', designation: 'Assistant Professor', specialization: 'Web Technologies, AI & Cyber Ethics' },
        { name: 'Ms. Smriti',               email: 'smriti@niet.co.in',             department: 'Data Science', designation: 'Assistant Professor', specialization: 'Web Technologies, AI & Cyber Ethics' },
        { name: 'Mr. Archit',               email: 'archit@niet.co.in',             department: 'Data Science', designation: 'Assistant Professor', specialization: 'Web Technologies, Mini Project' },
        { name: 'Ms. Garima',               email: 'garima@niet.co.in',             department: 'Data Science', designation: 'Assistant Professor', specialization: 'Web Technologies' },
        { name: 'Dr. Preeti Singh',         email: 'preeti.singh@niet.co.in',       department: 'Data Science', designation: 'Associate Professor', specialization: 'Database Management System' },
        { name: 'Mr. Chandrapal Singh',     email: 'chandrapal.singh@niet.co.in',   department: 'Data Science', designation: 'Assistant Professor', specialization: 'Data Structures & Algorithms' },
        { name: 'Ms. Rachna',               email: 'rachna@niet.co.in',             department: 'Data Science', designation: 'Assistant Professor', specialization: 'BIDV/Django' },
        { name: 'Mr. Sover Singh Bisht',    email: 'sover.bisht@niet.co.in',        department: 'Data Science', designation: 'Assistant Professor', specialization: 'BIDV/Django' },
        { name: 'Ms. Manisha',              email: 'manisha@niet.co.in',            department: 'Data Science', designation: 'Assistant Professor', specialization: 'BIDV/Django, DBMS Lab' },
        { name: 'Dr. Shormita',             email: 'shormita@niet.co.in',           department: 'Data Science', designation: 'Associate Professor', specialization: 'Technical Communication' },
        { name: 'Ms. Nisha',                email: 'nisha@niet.co.in',              department: 'Data Science', designation: 'Assistant Professor', specialization: 'Machine Learning' },
        { name: 'Mr. Saurabh Srivastava',   email: 'saurabh.srivastava@niet.co.in', department: 'Data Science', designation: 'Assistant Professor', specialization: 'Machine Learning' },
        { name: 'Mr. Utkarsh',              email: 'utkarsh@niet.co.in',            department: 'Data Science', designation: 'Assistant Professor', specialization: 'Machine Learning, AI & Cyber Ethics' },
        { name: 'Dr. Nidhi Sharma',         email: 'nidhi.sharma@niet.co.in',       department: 'Data Science', designation: 'Associate Professor', specialization: 'Database Management System' },
        { name: 'Ms. Aishwarya',            email: 'aishwarya@niet.co.in',          department: 'Data Science', designation: 'Assistant Professor', specialization: 'DSA Lab' },
        { name: 'Ms. Honey Singh',          email: 'honey.singh@niet.co.in',        department: 'Data Science', designation: 'Assistant Professor', specialization: 'Database Management System' },
        { name: 'Ms. Suman',                email: 'suman@niet.co.in',              department: 'Data Science', designation: 'Assistant Professor', specialization: 'Data Structures & Algorithms, DSA Lab' },
        { name: 'Ms. Divi',                 email: 'divi@niet.co.in',               department: 'Data Science', designation: 'Assistant Professor', specialization: 'Technical Communication' },
        { name: 'Mr. Shiv',                 email: 'shiv@niet.co.in',               department: 'Data Science', designation: 'Assistant Professor', specialization: 'Technical Communication' },
        { name: 'Ms. Mona',                 email: 'mona@niet.co.in',               department: 'Data Science', designation: 'Assistant Professor', specialization: 'Mini Project, DSA Lab' },
        { name: 'Ms. Amita',                email: 'amita@niet.co.in',              department: 'Data Science', designation: 'Assistant Professor', specialization: 'DBMS Lab, Mini Project' },
    ];

    const createdFaculty = await Faculty.bulkCreate(facultyData);
    console.log(`   ✅ ${createdFaculty.length} faculty members added.`);

    // Build a lookup map: name -> id
    const facMap = {};
    createdFaculty.forEach(f => { facMap[f.name] = f.id; });

    // ─── 3. Seed Courses ───
    console.log('📚 Seeding courses...');
    const courseData = [
        {
            code: 'BCSE0455',
            title: 'Web Technologies',
            credits: 3,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Covers modern web development — HTML5, CSS3, JavaScript, React. WT Workshop included. Classes per week: 2. Rooms: B317/203E/204E. Faculty: Ms. Shivangi, Ms. Sakshi, Ms. Amita Pathania, Ms. Smriti, Mr. Archit, Ms. Garima.',
            facultyId: facMap['Ms. Shivangi'],
        },
        {
            code: 'BCSE0402',
            title: 'Database Management System',
            credits: 4,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Relational databases, SQL, normalization, ER modeling, transactions. Classes per week: 4. Rooms: E301/E303/E305. Section A: Dr. Preeti Singh, Section B: Dr. Nidhi Sharma, Section C: Dr. Preeti Singh, Section D: Ms. Honey Singh.',
            facultyId: facMap['Dr. Preeti Singh'],
        },
        {
            code: 'BCSE0401',
            title: 'Data Structure and Algorithms-II',
            credits: 4,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Advanced data structures — trees, graphs, hashing, dynamic programming, greedy algorithms. Classes per week: 4. Rooms: E301/E303/E305. Section A & B: Mr. Chandrapal Singh, Section C & D: Ms. Suman.',
            facultyId: facMap['Mr. Chandrapal Singh'],
        },
        {
            code: 'BCSDS0412',
            title: 'BIDV/Django',
            credits: 4,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Big Data Visualization and Django framework. Classes per week: 4. Rooms: E203/E204/E306. Faculty: Ms. Rachna (G2), Mr. Sover Singh Bisht (G1), Ms. Manisha.',
            facultyId: facMap['Ms. Rachna'],
        },
        {
            code: 'BASL0401N',
            title: 'Technical Communication',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Professional writing, presentation skills, report writing, technical documentation. Classes per week: 2. Rooms: E301/E303/E305. Section A & B: Dr. Shormita, Section C & D: Ms. Divi / Mr. Shiv.',
            facultyId: facMap['Dr. Shormita'],
        },
        {
            code: 'BCSML0401',
            title: 'Machine Learning',
            credits: 4,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Supervised & unsupervised learning, neural networks, regression, classification, clustering. Classes per week: 4. Rooms: E303/E305. Section A: Ms. Nisha, Section B: Mr. Saurabh Srivastava, Section C: Ms. Nisha, Section D: Mr. Utkarsh.',
            facultyId: facMap['Ms. Nisha'],
        },
        {
            code: 'BNC0401Y',
            title: 'AI & Cyber Ethics',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'AI ethics, privacy, cybersecurity principles, responsible AI development. Classes per week: 2. Rooms: E301/E303/E305. Section A: Ms. Shivangi, Section B: Mr. Utkarsh, Section C: Ms. Amita Pathania, Section D: Ms. Smriti.',
            facultyId: facMap['Mr. Utkarsh'],
        },
        {
            code: 'BCSE0452Z',
            title: 'DBMS Lab',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Practical lab for Database Management System — SQL queries, procedures, triggers, joins. Classes per week: 4 (lab). Rooms: B317/E203/E204.',
            facultyId: facMap['Dr. Preeti Singh'],
        },
        {
            code: 'BCSE0451',
            title: 'DSA Lab',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Practical lab for Data Structures & Algorithms — implementation of trees, graphs, sorting, searching. Classes per week: 4 (lab). Rooms: B317/E203/E204.',
            facultyId: facMap['Ms. Suman'],
        },
        {
            code: 'BCSE0459',
            title: 'Mini Project',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Team-based mini project applying concepts learned across courses. Classes per week: 2. Rooms: E203/E301/E303/E305.',
            facultyId: facMap['Mr. Archit'],
        },
        {
            code: 'BCSCC0452',
            title: 'Problem Solving',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Competitive programming, algorithmic problem solving, coding challenges. Classes per week: 2.',
            facultyId: null,
        },
        {
            code: 'BASCCO401',
            title: 'ESD (Environmental Studies)',
            credits: 2,
            semester: 4,
            department: 'Data Science',
            capacity: 240,
            description: 'Environmental Science & Development — ecology, pollution, sustainability, environmental law. Classes per week: 2.',
            facultyId: null,
        },
    ];

    const createdCourses = await Course.bulkCreate(courseData);
    console.log(`   ✅ ${createdCourses.length} courses added.`);

    // ─── Summary ───
    console.log('\n========================================');
    console.log('  ✅  SEED COMPLETE');
    console.log('========================================');
    console.log(`  Faculty:  ${createdFaculty.length}`);
    console.log(`  Courses:  ${createdCourses.length}`);
    console.log('');
    console.log('  Courses seeded:');
    createdCourses.forEach(c => console.log(`    ${c.code} — ${c.title}`));
    console.log('========================================\n');

    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
