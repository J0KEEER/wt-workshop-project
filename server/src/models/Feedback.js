import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id',
    },
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sentimentScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  sentimentLabel: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral'),
    defaultValue: 'neutral',
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'feedbacks',
  timestamps: true,
});

export default Feedback;
