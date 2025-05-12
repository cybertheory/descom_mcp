import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
export function loadConfig(serverType: 'stdio' | 'sse' | 'streamableHttp') {
  // Determine the base directory for the server type
  const baseDir = path.resolve(process.cwd(), serverType);
  const envPath = path.join(baseDir, '.env');
  
  // Check if .env file exists, if not create from example
  if (!fs.existsSync(envPath) && fs.existsSync(`${envPath}.example`)) {
    console.warn(`No .env file found for ${serverType}, creating from example...`);
    fs.copyFileSync(`${envPath}.example`, envPath);
  }
  
  // Load environment variables
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error(`Error loading .env file for ${serverType}:`, result.error);
    process.exit(1);
  }
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(baseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return {
    serverType,
    baseDir,
    dataDir,
    tokenPath: path.join(dataDir, 'token.json'),
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    clientId: process.env.OAUTH_CLIENT_ID_BEARERAUTH,
    clientSecret: process.env.OAUTH_CLIENT_SECRET_BEARERAUTH,
    redirectUri: process.env.OAUTH_REDIRECT_URI || `http://localhost:3000/auth/callback`,
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.dexcom.com'
  };
}