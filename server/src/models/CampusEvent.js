import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const CampusEvent = sequelize.define('CampusEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    type: {
        type: DataTypes.ENUM('workshop', 'seminar', 'cultural', 'holiday', 'other'),
        defaultValue: 'workshop',
    },
    location: { type: DataTypes.STRING, allowNull: true },
});

export default CampusEvent;
