import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Student = sequelize.define('Student', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, field: 'user_id' },
    rollNo: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'roll_no' },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    semester: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    department: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: true },
    guardianName: { type: DataTypes.STRING, allowNull: true, field: 'guardian_name' },
    guardianPhone: { type: DataTypes.STRING, allowNull: true, field: 'guardian_phone' },
    admissionDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'admission_date' },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
        defaultValue: 'active',
    },
});

export default Student;
