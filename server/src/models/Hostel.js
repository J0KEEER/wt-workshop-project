import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Hostel = sequelize.define('Hostel', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    type: { 
        type: DataTypes.ENUM('Boys', 'Girls', 'Mixed'), 
        allowNull: false 
    },
    block: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.ENUM('active', 'renovating', 'inactive'),
        defaultValue: 'active',
    },
});

export default Hostel;
