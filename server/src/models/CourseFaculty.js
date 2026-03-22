import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const CourseFaculty = sequelize.define('CourseFaculty', {
    courseId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Courses',
            key: 'id',
        },
        field: 'course_id',
    },
    facultyId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: 'Faculty',
            key: 'id',
        },
        field: 'faculty_id',
    },
}, {
    tableName: 'course_faculty',
    timestamps: false,
});

export default CourseFaculty;
