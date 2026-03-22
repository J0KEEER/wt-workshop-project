import { initDB } from './db.js';
import { Department } from './models/index.js';

const departmentList = [
    { name: "B. Tech in Computer Science and Engineering (Data Science) (DS)", code: "DS" },
    { name: "B. Tech in Information Technology (IT)", code: "IT" },
    { name: "B. Tech in Information Technology (IT) Twinning", code: "IT-TW" },
    { name: "B. Tech in Mathematics and Computing", code: "MC" },
    { name: "B.Tech in Biotechnology (BT)", code: "BT" },
    { name: "B.Tech in Computer Science Engineering (CSE R)", code: "CSE-R" },
    { name: "B.Tech in Computer Science Engineering (CSE)", code: "CSE" },
    { name: "B.Tech in Computer Science Engineering (CSE) Twinning", code: "CSE-TW" },
    { name: "B.Tech in Computer Science (CS)", code: "CS" },
    { name: "B.Tech in Computer Science and Engineering (Artificial Intelligence Machine Learning) (AIML) Twinning", code: "AIML-TW" },
    { name: "B.Tech in Computer Science and Engineering (Artificial Intelligence Machine Learning) (AIML)", code: "AIML" },
    { name: "B.Tech in Computer Science and Engineering (Artificial Intelligence) (AI)", code: "AI" },
    { name: "B.Tech in Computer Science and Engineering (Artificial Intelligence) (AI) Twinning", code: "AI-TW" },
    { name: "B.Tech in Computer Science and Engineering (Internet of Things) (IoT)", code: "IOT" },
    { name: "B.Tech in Electronics and Communication Engineering (ECE)", code: "ECE" },
    { name: "B.Tech in Electronics Engineering (VLSI Design and Technology) (EE-VLSI)", code: "EE-VLSI" },
    { name: "B.Tech in Mechanical Engineering (ME)", code: "ME" },
    { name: "B.Tech. in Computer Science and Business System (CSBS)", code: "CSBS" },
    { name: "B.Tech. in Cyber Security (CYS)", code: "CYS" }
];

async function updateDepartments() {
    console.log('🔄 Connecting to database...');
    await initDB(false);

    console.log('🗑️  Dropping all existing departments...');
    await Department.destroy({ where: {} });

    console.log('⏳ Inserting new departments...');
    await Department.bulkCreate(departmentList);

    console.log('✅ Departments updated successfully!');
}

updateDepartments().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
