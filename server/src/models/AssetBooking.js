import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const AssetBooking = sequelize.define('AssetBooking', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    assetId: { type: DataTypes.INTEGER, allowNull: false, field: 'asset_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    startTime: { type: DataTypes.DATE, allowNull: false, field: 'start_time' },
    endTime: { type: DataTypes.DATE, allowNull: false, field: 'end_time' },
    purpose: { type: DataTypes.STRING, allowNull: true },
    status: {
        type: DataTypes.ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled'),
        defaultValue: 'Confirmed'
    },
});

export default AssetBooking;
