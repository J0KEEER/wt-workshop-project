import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const AttendanceSession = sequelize.define('AttendanceSession', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.INTEGER, allowNull: false, field: 'course_id' },
    teacherId: { type: DataTypes.INTEGER, allowNull: true, field: 'teacher_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    period: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Period 1' },
});

export default AttendanceSession;
