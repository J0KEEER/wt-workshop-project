import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Department = sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    headOfDepartment: { type: DataTypes.STRING, allowNull: true, field: 'head_of_department' },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
    },
});

export default Department;
