import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon with proper error handling
neonConfig.webSocketConstructor = ws;

// Simplified configuration to avoid WebSocket errors
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = true;

// Add custom error handling for WebSocket
neonConfig.wsProxy = (host) => `${host}:443/v1`;

// Disable problematic features that cause connection issues
neonConfig.pipelineTLS = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with simplified configuration to avoid WebSocket errors
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced pool size for stability
  min: 1,  // Minimum connections
  idleTimeoutMillis: 30000, // Shorter idle timeout
  connectionTimeoutMillis: 10000, // Longer timeout for initial connection
});

export const db = drizzle({ client: pool, schema });