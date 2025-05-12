import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Constants for Dexcom OAuth
const DEXCOM_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.dexcom.com' 
  : 'https://sandbox-api.dexcom.com';

const OAUTH_LOGIN_URL = `${DEXCOM_API_URL}/v2/oauth2/login`;
const OAUTH_TOKEN_URL = `${DEXCOM_API_URL}/v2/oauth2/token`;

// Token cache interface
export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Timestamp when token expires
  token_type: string;
}

/**
 * Generates the authorization URL for Dexcom OAuth
 */
export function getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'offline_access',
    state: state
  });
  
  return `${OAUTH_LOGIN_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 */
export async function exchangeCodeForToken(
  code: string, 
  clientId: string, 
  clientSecret: string, 
  redirectUri: string
): Promise<TokenInfo> {
  try {
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const response = await axios.post(OAUTH_TOKEN_URL, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;
    
    // Calculate expiration time (current time + expires_in - 60 second buffer)
    const expiresAt = Date.now() + (expires_in * 1000) - 60000;
    
    return {
      access_token,
      refresh_token,
      expires_at: expiresAt,
      token_type
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Refreshes an expired access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenInfo> {
  try {
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await axios.post(OAUTH_TOKEN_URL, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;
    
    // Calculate expiration time (current time + expires_in - 60 second buffer)
    const expiresAt = Date.now() + (expires_in * 1000) - 60000;
    
    return {
      access_token,
      refresh_token: refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
      expires_at: expiresAt,
      token_type
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Saves token information to a file
 */
export function saveTokenToFile(tokenInfo: TokenInfo, filePath: string): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(tokenInfo, null, 2));
    console.error(`Token saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving token to ${filePath}:`, error);
  }
}

/**
 * Loads token information from a file
 */
export function loadTokenFromFile(filePath: string): TokenInfo | null {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as TokenInfo;
    }
  } catch (error) {
    console.error(`Error loading token from ${filePath}:`, error);
  }
  return null;
}

/**
 * Updates environment variables with token information
 */
export function updateEnvWithToken(tokenInfo: TokenInfo, envPath: string): void {
  try {
    // Read existing .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Replace or add OAUTH_TOKEN_BEARERAUTH
    const tokenRegex = /OAUTH_TOKEN_BEARERAUTH=.*/;
    const tokenLine = `OAUTH_TOKEN_BEARERAUTH=${tokenInfo.access_token}`;
    
    if (tokenRegex.test(envContent)) {
      envContent = envContent.replace(tokenRegex, tokenLine);
    } else {
      envContent += `\n${tokenLine}`;
    }

    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent);
    console.error(`Updated .env file at ${envPath}`);
    
    // Also update process.env for immediate use
    process.env.OAUTH_TOKEN_BEARERAUTH = tokenInfo.access_token;
  } catch (error) {
    console.error(`Error updating .env file at ${envPath}:`, error);
  }
}

/**
 * Gets a valid token, refreshing if necessary
 */
export async function getValidToken(
  tokenStoragePath: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    // Load token from storage
    let tokenInfo = loadTokenFromFile(tokenStoragePath);
    
    // If no token or token is expired, try to refresh
    if (!tokenInfo) {
      console.error('No token found in storage');
      return null;
    }
    
    // Check if token is expired
    if (Date.now() >= tokenInfo.expires_at) {
      console.error('Token expired, attempting to refresh');
      
      // Refresh the token
      if (tokenInfo.refresh_token) {
        tokenInfo = await refreshAccessToken(
          tokenInfo.refresh_token,
          clientId,
          clientSecret
        );
        
        // Save the refreshed token
        saveTokenToFile(tokenInfo, tokenStoragePath);
      } else {
        console.error('No refresh token available');
        return null;
      }
    }
    
    return tokenInfo.access_token;
  } catch (error) {
    console.error('Error getting valid token:', error);
    return null;
  }
}