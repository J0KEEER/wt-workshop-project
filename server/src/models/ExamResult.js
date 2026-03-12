import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const ExamResult = sequelize.define('ExamResult', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    examId: { type: DataTypes.INTEGER, allowNull: false, field: 'exam_id' },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    marksObtained: { type: DataTypes.FLOAT, allowNull: true, field: 'marks_obtained' },
    grade: { type: DataTypes.STRING, allowNull: true },
    remarks: { type: DataTypes.STRING, allowNull: true },
});

export default ExamResult;
