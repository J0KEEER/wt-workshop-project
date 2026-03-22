import { initDB, sequelize } from './db.js';

async function forceLink() {
    await initDB(false);
    
    // Hard link all to ID 1 since they are all DS
    const dsId = 1;
    const dsName = "B. Tech in Computer Science and Engineering (Data Science & AI)";
    
    console.log(`Setting all records to Dept ID ${dsId} (${dsName}) via SQL...`);
    
    await sequelize.query(`UPDATE students SET department_id = ?, department = ?`, { replacements: [dsId, dsName] });
    await sequelize.query(`UPDATE faculties SET department_id = ?, department = ?`, { replacements: [dsId, dsName] });
    await sequelize.query(`UPDATE courses SET department_id = ?, department = ?`, { replacements: [dsId, dsName] });

    console.log('✅ Force link success via SQL.');
}

forceLink().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
