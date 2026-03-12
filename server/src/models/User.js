import {  DataTypes  } from 'sequelize';
import {  sequelize  } from '../db.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
    role: {
        type: DataTypes.ENUM('admin', 'faculty', 'student', 'librarian', 'staff'),
        allowNull: false,
        defaultValue: 'student',
    },
    firstName: { type: DataTypes.STRING, allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.STRING, allowNull: true, field: 'last_name' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.passwordHash) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
            }
        },
    },
});

User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.password_hash;
    return values;
};

export default User;
