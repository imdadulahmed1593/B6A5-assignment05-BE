import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  database_url: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || "fallback-secret-change-in-production",
    expires_in: process.env.JWT_EXPIRES_IN || "7d",
  },
  client_url: process.env.CLIENT_URL || "http://localhost:3000",
  bcrypt_salt_rounds: 12,
};
