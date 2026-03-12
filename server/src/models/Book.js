import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const Book = sequelize.define('Book', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    author: { type: DataTypes.STRING, allowNull: false },
    isbn: { type: DataTypes.STRING, allowNull: true, unique: true },
    publisher: { type: DataTypes.STRING, allowNull: true },
    category: {
        type: DataTypes.ENUM('textbook', 'reference', 'fiction', 'journal', 'magazine', 'other'),
        defaultValue: 'textbook',
    },
    edition: { type: DataTypes.STRING, allowNull: true },
    year: { type: DataTypes.INTEGER, allowNull: true },
    totalCopies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'total_copies' },
    availableCopies: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'available_copies' },
    location: { type: DataTypes.STRING, allowNull: true },
});

export default Book;
