const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASS = process.env.REDIS_PASS || "";

export const env = {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASS,
};
