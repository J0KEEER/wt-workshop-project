import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    feeId: { type: DataTypes.INTEGER, allowNull: false, field: 'fee_id' },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'payment_date' },
    method: {
        type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online', 'cheque'),
        defaultValue: 'online',
    },
    transactionId: { type: DataTypes.STRING, allowNull: true, field: 'transaction_id' },
    remarks: { type: DataTypes.STRING, allowNull: true },
});

export default Payment;
