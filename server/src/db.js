import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '..', process.env.DB_PATH || './database.sqlite'),
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

export async function initDB(force = false) {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ force });
    console.log('✅ Models synchronized');
  } catch (err) {
    console.error('❌ Database error:', err);
    process.exit(1);
  }
}
