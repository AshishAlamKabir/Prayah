import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Add retry configuration for connection stability
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with optimized configuration for performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase pool size
  min: 2,  // Keep minimum connections warm
  idleTimeoutMillis: 60000, // Keep connections longer
  connectionTimeoutMillis: 5000, // Reduce timeout for faster failure
  acquireTimeoutMillis: 5000,
});

export const db = drizzle({ client: pool, schema });