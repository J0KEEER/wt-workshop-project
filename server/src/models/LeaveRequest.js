import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const LeaveRequest = sequelize.define('LeaveRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    type: {
        type: DataTypes.ENUM('sick', 'casual', 'annual', 'unpaid', 'other'),
        allowNull: false,
        defaultValue: 'casual',
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
    endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    approverId: { type: DataTypes.INTEGER, allowNull: true, field: 'approver_id' },
}, {
    tableName: 'leave_requests',
    timestamps: true,
    underscored: true,
});

export default LeaveRequest;
