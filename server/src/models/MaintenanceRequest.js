import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    assetId: { type: DataTypes.INTEGER, allowNull: false, field: 'asset_id' },
    reportedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'reported_by' },
    issue: { type: DataTypes.TEXT, allowNull: false },
    priority: { 
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        defaultValue: 'Medium'
    },
    status: {
        type: DataTypes.ENUM('Pending', 'In Progress', 'Resolved', 'Cancelled'),
        defaultValue: 'Pending'
    },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'resolved_by' },
    resolutionDate: { type: DataTypes.DATE, allowNull: true, field: 'resolution_date' },
    cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
});

export default MaintenanceRequest;
