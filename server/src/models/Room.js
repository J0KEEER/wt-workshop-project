import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Room = sequelize.define('Room', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    hostelId: { type: DataTypes.INTEGER, allowNull: false, field: 'hostel_id' },
    roomNumber: { type: DataTypes.STRING, allowNull: false, field: 'room_number' },
    floor: { type: DataTypes.INTEGER, allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
    type: { 
        type: DataTypes.ENUM('AC', 'Non-AC', 'Shared', 'Private'),
        defaultValue: 'Non-AC' 
    },
    monthlyFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, field: 'monthly_fee' },
    status: {
        type: DataTypes.ENUM('available', 'full', 'maintenance'),
        defaultValue: 'available',
    },
});

export default Room;
