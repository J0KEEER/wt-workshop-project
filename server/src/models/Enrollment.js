import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Enrollment = sequelize.define('Enrollment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    courseId: { type: DataTypes.INTEGER, allowNull: false, field: 'course_id' },
    term: { type: DataTypes.STRING, allowNull: false, defaultValue: '2024-Spring' },
    enrollmentDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'enrollment_date' },
    status: {
        type: DataTypes.ENUM('active', 'dropped', 'completed'),
        defaultValue: 'active',
    },
});

export default Enrollment;
