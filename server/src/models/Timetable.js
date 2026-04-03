import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Timetable = sequelize.define('Timetable', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.INTEGER, allowNull: false, field: 'course_id' },
    dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 6 }, // 0 = Sunday, 1 = Monday, etc.
    },
    startTime: { type: DataTypes.STRING, allowNull: false, field: 'start_time' }, // Format: HH:MM
    endTime: { type: DataTypes.STRING, allowNull: false, field: 'end_time' }, // Format: HH:MM
    room: { type: DataTypes.STRING, allowNull: true },
});

export default Timetable;
