import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const BookLoan = sequelize.define('BookLoan', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    borrowDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'borrow_date' },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'due_date' },
    returnDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'return_date' },
    fine: { type: DataTypes.FLOAT, defaultValue: 0 },
    status: {
        type: DataTypes.ENUM('active', 'returned', 'overdue'),
        defaultValue: 'active',
    },
});

export default BookLoan;
