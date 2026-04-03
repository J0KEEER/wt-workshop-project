import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Holiday = sequelize.define('Holiday', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    type: {
        type: DataTypes.ENUM('national', 'internal', 'observance'),
        defaultValue: 'national',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
});

export default Holiday;
