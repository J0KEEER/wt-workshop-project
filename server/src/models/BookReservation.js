import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';

const BookReservation = sequelize.define('BookReservation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookId: { type: DataTypes.INTEGER, allowNull: false, field: 'book_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    reservationDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'reservation_date' },
    status: {
        type: DataTypes.ENUM('pending', 'notified', 'fulfilled', 'cancelled'),
        defaultValue: 'pending',
    },
});

export default BookReservation;
