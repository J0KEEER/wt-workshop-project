import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Asset = sequelize.define('Asset', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { 
        type: DataTypes.ENUM('Electronics', 'Lab Equipment', 'Furniture', 'Sports', 'Vehicle Component', 'Other'),
        allowNull: false,
        defaultValue: 'Other'
    },
    serialNumber: { type: DataTypes.STRING, unique: true, allowNull: true, field: 'serial_number' },
    status: {
        type: DataTypes.ENUM('available', 'in_use', 'maintenance', 'retired'),
        defaultValue: 'available'
    },
    condition: {
        type: DataTypes.ENUM('New', 'Good', 'Fair', 'Poor', 'Damaged'),
        defaultValue: 'Good'
    },
    roomId: { type: DataTypes.INTEGER, allowNull: true, field: 'room_id' },
    purchaseDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'purchase_date' },
    lastServiceDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'last_service_date' },
    metadata: { type: DataTypes.JSON, allowNull: true } // Dynamic properties like warranty, manufacturer
});

export default Asset;
