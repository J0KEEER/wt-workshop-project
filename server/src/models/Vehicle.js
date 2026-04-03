import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Vehicle = sequelize.define('Vehicle', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleNumber: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'vehicle_number' },
    driverName: { type: DataTypes.STRING, allowNull: false, field: 'driver_name' },
    driverContact: { type: DataTypes.STRING, allowNull: false, field: 'driver_contact' },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },
    status: {
        type: DataTypes.ENUM('active', 'maintenance', 'retired'),
        defaultValue: 'active',
    },
});

export default Vehicle;
