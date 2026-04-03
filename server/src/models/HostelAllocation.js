import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const HostelAllocation = sequelize.define('HostelAllocation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    roomId: { type: DataTypes.INTEGER, allowNull: false, field: 'room_id' },
    startDate: { type: DataTypes.DATE, allowNull: false, field: 'start_date' },
    endDate: { type: DataTypes.DATE, allowNull: true, field: 'end_date' },
    academicYear: { type: DataTypes.STRING, allowNull: false, field: 'academic_year' },
    status: {
        type: DataTypes.ENUM('active', 'vacated', 'cancelled'),
        defaultValue: 'active',
    },
});

export default HostelAllocation;
