import { Course, CourseFaculty } from './models/index.js';
import { sequelize } from './db.js';

async function migrate() {
    try {
        await sequelize.sync();
        const courses = await Course.findAll();
        for (const course of courses) {
            if (course.facultyId) {
                // Check if already exists
                const exists = await CourseFaculty.findOne({
                    where: { courseId: course.id, facultyId: course.facultyId }
                });
                if (!exists) {
                    await CourseFaculty.create({
                        courseId: course.id,
                        facultyId: course.facultyId
                    });
                    console.log(`Migrated faculty for course: ${course.title}`);
                }
            }
        }
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
