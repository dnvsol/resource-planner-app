import dotenv from 'dotenv';
dotenv.config();                       // CWD (when running from monorepo root)
dotenv.config({ path: '../../.env' }); // monorepo root (when CWD is apps/api/)

import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from './env.js';

const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  url: env.DATABASE_URL,
  entities: [__dirname + '/../modules/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  migrationsRun: false,
  charset: 'utf8mb4',
  extra: {
    connectionLimit: 20,
    waitForConnections: true,
    connectTimeout: 5_000,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);

export async function initializeDatabase(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  try {
    await AppDataSource.initialize();
    console.log('[database] Connection established successfully');
    return AppDataSource;
  } catch (error) {
    console.error('[database] Failed to initialize connection:', error);
    throw error;
  }
}
