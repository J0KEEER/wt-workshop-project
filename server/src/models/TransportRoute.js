import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const TransportRoute = sequelize.define('TransportRoute', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    routeName: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'route_name' },
    description: { type: DataTypes.TEXT, allowNull: true },
    startPoint: { type: DataTypes.STRING, allowNull: true, field: 'start_point' },
    endPoint: { type: DataTypes.STRING, allowNull: true, field: 'end_point' },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
    },
});

export default TransportRoute;
