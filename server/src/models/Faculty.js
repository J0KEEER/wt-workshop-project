import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Faculty = sequelize.define('Faculty', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, field: 'user_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: true, field: 'department_id' },
    department: { type: DataTypes.STRING, allowNull: false },
    designation: {
        type: DataTypes.ENUM('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'),
        defaultValue: 'Assistant Professor',
    },
    specialization: { type: DataTypes.STRING, allowNull: true },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'joining_date' },
    status: {
        type: DataTypes.ENUM('active', 'on_leave', 'retired', 'resigned'),
        defaultValue: 'active',
    },
    baseSalary: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        field: 'base_salary'
    },
});

export default Faculty;
