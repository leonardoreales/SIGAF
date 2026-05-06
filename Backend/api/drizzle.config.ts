import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
const url = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
