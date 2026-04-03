import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const TransportSubscription = sequelize.define('TransportSubscription', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
    stopId: { type: DataTypes.INTEGER, allowNull: false, field: 'stop_id' },
    vehicleId: { type: DataTypes.INTEGER, allowNull: true, field: 'vehicle_id' },
    startDate: { type: DataTypes.DATE, allowNull: false, field: 'start_date' },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'cancelled'),
        defaultValue: 'active',
    },
});

export default TransportSubscription;
