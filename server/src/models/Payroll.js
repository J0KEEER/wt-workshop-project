import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Payroll = sequelize.define('Payroll', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    baseSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'base_salary' },
    allowances: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'allowances' },
    deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'deductions' },
    netPay: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'net_pay' },
    status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'paid', 'failed'),
        defaultValue: 'draft',
    },
    paidAt: { type: DataTypes.DATE, allowNull: true, field: 'paid_at' },
    remarks: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: 'payrolls',
    timestamps: true,
    underscored: true,
});

export default Payroll;
