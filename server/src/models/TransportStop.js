import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const TransportStop = sequelize.define('TransportStop', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    routeId: { type: DataTypes.INTEGER, allowNull: false, field: 'route_id' },
    stopName: { type: DataTypes.STRING, allowNull: false, field: 'stop_name' },
    pickupTime: { type: DataTypes.STRING, allowNull: false, field: 'pickup_time' },
    dropoffTime: { type: DataTypes.STRING, allowNull: false, field: 'dropoff_time' },
    monthlyFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, field: 'monthly_fee' },
});

export default TransportStop;
