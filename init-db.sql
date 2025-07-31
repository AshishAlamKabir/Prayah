-- Database initialization script for Prayas
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS prayas_db;

-- Create user if it doesn't exist (this is handled by POSTGRES_USER env var)
-- CREATE USER IF NOT EXISTS prayas_user WITH PASSWORD 'prayas_password';

-- Grant privileges
-- GRANT ALL PRIVILEGES ON DATABASE prayas_db TO prayas_user;

-- Set timezone
SET timezone = 'UTC';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Prayas database initialized successfully at %', NOW();
END $$;