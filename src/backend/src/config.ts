import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-super-secret',
  accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION ?? '15m',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION ?? '7d',
  databaseFile: process.env.DATABASE_FILE ?? 'agentemotor.sqlite'
};
