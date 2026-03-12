import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Exam = sequelize.define('Exam', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.INTEGER, allowNull: false, field: 'course_id' },
    title: { type: DataTypes.STRING, allowNull: false },
    type: {
        type: DataTypes.ENUM('midterm', 'final', 'quiz', 'assignment', 'practical'),
        defaultValue: 'midterm',
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    totalMarks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100, field: 'total_marks' },
    term: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
});

export default Exam;
