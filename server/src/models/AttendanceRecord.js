import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const AttendanceRecord = sequelize.define('AttendanceRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sessionId: { type: DataTypes.INTEGER, allowNull: false, field: 'session_id' },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
        allowNull: false,
        defaultValue: 'absent',
    },
    remarks: { type: DataTypes.STRING, allowNull: true },
});

export default AttendanceRecord;
