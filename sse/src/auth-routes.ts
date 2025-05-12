import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

// Get client credentials from environment
const CLIENT_ID = process.env.OAUTH_CLIENT_ID_BEARERAUTH || '';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET_BEARERAUTH || '';
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export function setupAuthRoutes(app: Hono) {
  // Route to initiate OAuth flow
  app.get('/auth/login', (c) => {
    // Generate and store state parameter to prevent CSRF
    const state = uuid();
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'Lax'
    });
    
    // Generate authorization URL
    const authUrl = getAuthorizationUrl(CLIENT_ID, REDIRECT_URI, state);
    
    // Redirect to Dexcom login
    return c.redirect(authUrl);
  });
  
  // OAuth callback route
  app.get('/auth/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    
    // Get stored state from cookie
    const storedState = getCookie(c, 'oauth_state');
    
    // Clear the state cookie
    setCookie(c, 'oauth_state', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0
    });
    
    // Check for errors
    if (error) {
      return c.html(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Error: ${error}</p>
            <p><a href="/">Return to home</a></p>
          </body>
        </html>
      `);
    }
    
    // Validate state to prevent CSRF
    if (!state || !storedState || state !== storedState) {
      return c.html(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Invalid state parameter. Possible CSRF attack.</p>
            <p><a href="/">Return to home</a></p>
          </body>
        </html>
      `);
    }
    
    // Validate code
    if (!code) {
      return c.html(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>No authorization code received.</p>
            <p><a href="/">Return to home</a></p>
          </body>
        </html>
      `);
    }
    
    try {
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
      
      // Set a cookie to indicate user is authenticated (for UI purposes only)
      setCookie(c, 'authenticated', 'true', {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'Lax'
      });
      
      // Redirect to home with success message
      return c.html(`
        <html>
          <head>
            <title>Authentication Success</title>
            <meta http-equiv="refresh" content="3;url=/" />
          </head>
          <body>
            <h1>Authentication Successful</h1>
            <p>You have successfully authenticated with Dexcom.</p>
            <p>Redirecting to home page in 3 seconds...</p>
            <p><a href="/">Return to home now</a></p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return c.html(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Error exchanging code for token: ${error instanceof Error ? error.message : String(error)}</p>
            <p><a href="/">Return to home</a></p>
          </body>
        </html>
      `);
    }
  });
  
  // Route to check authentication status
  app.get('/auth/status', (c) => {
    const isAuthenticated = getCookie(c, 'authenticated') === 'true';
    return c.json({ authenticated: isAuthenticated });
  });
  
  // Route to logout
  app.get('/auth/logout', (c) => {
    // Clear authentication cookie
    setCookie(c, 'authenticated', '', {
      httpOnly: false,
      path: '/',
      maxAge: 0
    });
    
    // Note: We don't delete the token file as it might be needed by the server
    // A proper logout would also revoke the token with Dexcom
    
    return c.redirect('/');
  });
  
  return app;
}