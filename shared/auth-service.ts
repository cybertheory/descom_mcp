import { TokenInfo, getValidToken, saveTokenToFile, refreshAccessToken, exchangeCodeForToken } from './oauth-utils.js';
import fs from 'fs';

export class AuthService {
  private tokenPath: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  
  constructor(tokenPath: string, clientId: string, clientSecret: string, redirectUri: string) {
    this.tokenPath = tokenPath;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }
  
  async getToken(): Promise<string | null> {
    return await getValidToken(this.tokenPath, this.clientId, this.clientSecret);
  }
  
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
  
  async handleAuthorizationCode(code: string): Promise<TokenInfo> {
    const tokenInfo = await exchangeCodeForToken(
      code,
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    
    saveTokenToFile(tokenInfo, this.tokenPath);
    return tokenInfo;
  }
  
  async logout(): Promise<void> {
    if (fs.existsSync(this.tokenPath)) {
      fs.unlinkSync(this.tokenPath);
    }
  }
}