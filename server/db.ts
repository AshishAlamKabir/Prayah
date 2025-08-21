import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Safe Neon configuration for Node.js compatibility
neonConfig.webSocketConstructor = ws;

// Conservative settings to prevent WebSocket errors
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;

// Safe error handling - don't modify error objects
const originalConsoleError = console.error;
console.error = (...args) => {
  // Log errors safely without modifying error.message property
  const safeArgs = args.map(arg => {
    if (arg instanceof Error) {
      return `Error: ${arg.name} - ${arg.message}`;
    }
    return arg;
  });
  originalConsoleError(...safeArgs);
};

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Safe pool configuration compatible with latest Neon serverless
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Conservative pool size for serverless
  min: 0, // No minimum connections for serverless
  idleTimeoutMillis: 20000, // Shorter idle timeout for serverless
  connectionTimeoutMillis: 15000, // Longer connection timeout
});

export const db = drizzle({ client: pool, schema });