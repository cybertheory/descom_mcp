#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import open from 'open';
import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';

import { 
  getAuthorizationUrl, 
  exchangeCodeForToken, 
  saveTokenToFile,
  updateEnvWithToken
} from '../../shared/oauth-utils.js';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_STORAGE_PATH = path.join(__dirname, '..', 'data', 'token.json');
const ENV_PATH = path.join(__dirname, '..', '.env');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
}

// Get client credentials from environment or prompt for them
let CLIENT_ID = process.env.OAUTH_CLIENT_ID_BEARERAUTH || '';
let CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET_BEARERAUTH || '';
const REDIRECT_URI = 'http://localhost:3333/callback';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for client ID if not provided
async function promptForCredentials() {
  if (!CLIENT_ID) {
    CLIENT_ID = await new Promise(resolve => {
      rl.question('Enter your Dexcom OAuth Client ID: ', answer => {
        resolve(answer.trim());
      });
    });
  }
  
  if (!CLIENT_SECRET) {
    CLIENT_SECRET = await new Promise(resolve => {
      rl.question('Enter your Dexcom OAuth Client Secret: ', answer => {
        resolve(answer.trim());
      });
    });
  }
}

// Start a temporary HTTP server to handle the OAuth callback
function startCallbackServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Authentication Error</title></head>
              <body>
                <h1>Authentication Error</h1>
                <p>Error: ${error}</p>
                <p>You can close this window now.</p>
              </body>
            </html>
          `);
          reject(new Error(`OAuth error: ${error}`));
          server.close();
          return;
        }
        
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Authentication Error</title></head>
              <body>
                <h1>Authentication Error</h1>
                <p>No authorization code received.</p>
                <p>You can close this window now.</p>
              </body>
            </html>
          `);
          reject(new Error('No authorization code received'));
          server.close();
          return;
        }
        
        // Success response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>Authentication Success</title></head>
            <body>
              <h1>Authentication Successful</h1>
              <p>You have successfully authenticated with Dexcom.</p>
              <p>You can close this window now.</p>
            </body>
          </html>
        `);
        
        resolve(code);
        server.close();
      } catch (error) {
        console.error('Error handling callback:', error);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>Server Error</title></head>
            <body>
              <h1>Server Error</h1>
              <p>An error occurred while processing the authentication.</p>
              <p>You can close this window now.</p>
            </body>
          </html>
        `);
        reject(error);
        server.close();
      }
    });
    
    server.listen(3333, () => {
      console.log('Callback server listening on port 3333');
    });
    
    server.on('error', (error) => {
      console.error('Server error:', error);
      reject(error);
    });
  });
}

// Main function to run the OAuth flow
async function runOAuthFlow() {
  try {
    console.log('Starting Dexcom OAuth flow...');
    
    // Prompt for credentials if needed
    await promptForCredentials();
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Client ID and Client Secret are required');
    }
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Generate authorization URL
    const authUrl = getAuthorizationUrl(CLIENT_ID, REDIRECT_URI, state);
    
    console.log('\nOpening browser for Dexcom authentication...');
    console.log(`If the browser doesn't open automatically, please visit:\n${authUrl}\n`);
    
    // Open the browser
    await open(authUrl);
    
    console.log('Waiting for authentication...');
    
    // Start callback server and wait for the code
    const code = await startCallbackServer();
    
    console.log('Authorization code received, exchanging for token...');
    
    // Exchange code for token
    const tokenInfo = await exchangeCodeForToken(
      code,
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
    
    // Save token to file
    saveTokenToFile(tokenInfo, TOKEN_STORAGE_PATH);
    
    // Update environment variables
    updateEnvWithToken(tokenInfo, ENV_PATH);
    
    console.log('\nAuthentication successful!');
    console.log(`Token saved to ${TOKEN_STORAGE_PATH}`);
    console.log(`Environment variables updated in ${ENV_PATH}`);
    console.log('\nYou can now use the Dexcom API with your MCP server.');
    
  } catch (error) {
    console.error('\nAuthentication error:', error);
  } finally {
    rl.close();
  }
}

// Run the OAuth flow
runOAuthFlow();