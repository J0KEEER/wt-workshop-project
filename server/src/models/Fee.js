import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Fee = sequelize.define('Fee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    category: {
        type: DataTypes.ENUM('tuition', 'library', 'laboratory', 'hostel', 'transport', 'exam', 'other'),
        defaultValue: 'tuition',
    },
    type: {
        type: DataTypes.ENUM('tuition', 'library', 'laboratory', 'hostel', 'transport', 'exam', 'other'),
        defaultValue: 'tuition',
    },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'due_date' },
    status: {
        type: DataTypes.ENUM('paid', 'pending', 'overdue', 'partial'),
        defaultValue: 'pending',
    },
    paidAmount: { type: DataTypes.FLOAT, defaultValue: 0, field: 'paid_amount' },
    term: { type: DataTypes.STRING, allowNull: true },
}, {
    hooks: {
        beforeSave: (fee) => {
            if (fee.status !== 'paid') {
                const today = new Date().toISOString().split('T')[0];
                if (fee.dueDate < today) {
                    fee.status = 'overdue';
                } else if (fee.paidAmount > 0 && fee.paidAmount < fee.amount) {
                    fee.status = 'partial';
                } else if (fee.paidAmount === 0) {
                    fee.status = 'pending';
                }
            }
        }
    }
});

export default Fee;
