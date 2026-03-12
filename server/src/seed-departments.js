/**
 * Seed 19 NIET departments
 * Run: node src/seed-departments.js
 */
const { sequelize } = require('./db');
const { Department } = require('./models');

async function seed() {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync();

    console.log('🏛️  Seeding departments...');
    const depts = [
        { name: 'B.Tech in Computer Science and Engineering (Data Science)', code: 'DS' },
        { name: 'B.Tech in Information Technology', code: 'IT' },
        { name: 'B.Tech in Information Technology Twinning', code: 'IT-TW' },
        { name: 'B.Tech in Mathematics and Computing', code: 'MnC' },
        { name: 'B.Tech in Biotechnology', code: 'BT' },
        { name: 'B.Tech in Computer Science Engineering (CSE R)', code: 'CSE-R' },
        { name: 'B.Tech in Computer Science Engineering', code: 'CSE' },
        { name: 'B.Tech in Computer Science Engineering Twinning', code: 'CSE-TW' },
        { name: 'B.Tech in Computer Science', code: 'CS' },
        { name: 'B.Tech in Computer Science and Engineering (AIML) Twinning', code: 'AIML-TW' },
        { name: 'B.Tech in Computer Science and Engineering (AIML)', code: 'AIML' },
        { name: 'B.Tech in Computer Science and Engineering (AI)', code: 'AI' },
        { name: 'B.Tech in Computer Science and Engineering (AI) Twinning', code: 'AI-TW' },
        { name: 'B.Tech in Computer Science and Engineering (IoT)', code: 'IoT' },
        { name: 'B.Tech in Electronics and Communication Engineering', code: 'ECE' },
        { name: 'B.Tech in Electronics Engineering (VLSI Design and Technology)', code: 'EE-VLSI' },
        { name: 'B.Tech in Mechanical Engineering', code: 'ME' },
        { name: 'B.Tech in Computer Science and Business System', code: 'CSBS' },
        { name: 'B.Tech in Cyber Security', code: 'CYS' },
    ];

    const created = await Department.bulkCreate(depts, { ignoreDuplicates: true });
    console.log(`✅ ${created.length} departments seeded.`);
    created.forEach(d => console.log(`   ${d.code.padEnd(10)} ${d.name}`));
    process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
