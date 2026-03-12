import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    courseId: { type: DataTypes.INTEGER, allowNull: false, field: 'course_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
        allowNull: false,
        defaultValue: 'present',
    },
    markedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'marked_by' },
    remarks: { type: DataTypes.STRING, allowNull: true },
});

export default Attendance;
