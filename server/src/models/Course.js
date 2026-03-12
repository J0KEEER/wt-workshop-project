import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    semester: { type: DataTypes.INTEGER, allowNull: false },
    department: { type: DataTypes.STRING, allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    facultyId: { type: DataTypes.INTEGER, allowNull: true, field: 'faculty_id' },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'completed'),
        defaultValue: 'active',
    },
});

export default Course;
