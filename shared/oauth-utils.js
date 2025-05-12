"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorizationUrl = getAuthorizationUrl;
exports.exchangeCodeForToken = exchangeCodeForToken;
exports.refreshAccessToken = refreshAccessToken;
exports.saveTokenToFile = saveTokenToFile;
exports.loadTokenFromFile = loadTokenFromFile;
exports.updateEnvWithToken = updateEnvWithToken;
exports.getValidToken = getValidToken;
var axios_1 = __importDefault(require("axios"));
var fs_1 = __importDefault(require("fs"));
// Constants for Dexcom OAuth
var DEXCOM_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.dexcom.com'
    : 'https://sandbox-api.dexcom.com';
var OAUTH_LOGIN_URL = "".concat(DEXCOM_API_URL, "/v2/oauth2/login");
var OAUTH_TOKEN_URL = "".concat(DEXCOM_API_URL, "/v2/oauth2/token");
/**
 * Generates the authorization URL for Dexcom OAuth
 */
function getAuthorizationUrl(clientId, redirectUri, state) {
    var params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'offline_access',
        state: state
    });
    return "".concat(OAUTH_LOGIN_URL, "?").concat(params.toString());
}
/**
 * Exchanges an authorization code for access and refresh tokens
 */
function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    return __awaiter(this, void 0, void 0, function () {
        var formData, response, _a, access_token, refresh_token, expires_in, token_type, expiresAt, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    formData = new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        code: code,
                        grant_type: 'authorization_code',
                        redirect_uri: redirectUri
                    });
                    return [4 /*yield*/, axios_1.default.post(OAUTH_TOKEN_URL, formData.toString(), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })];
                case 1:
                    response = _b.sent();
                    _a = response.data, access_token = _a.access_token, refresh_token = _a.refresh_token, expires_in = _a.expires_in, token_type = _a.token_type;
                    expiresAt = Date.now() + (expires_in * 1000) - 60000;
                    return [2 /*return*/, {
                            access_token: access_token,
                            refresh_token: refresh_token,
                            expires_at: expiresAt,
                            token_type: token_type
                        }];
                case 2:
                    error_1 = _b.sent();
                    console.error('Error exchanging code for token:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Refreshes an expired access token using the refresh token
 */
function refreshAccessToken(refreshToken, clientId, clientSecret) {
    return __awaiter(this, void 0, void 0, function () {
        var formData, response, _a, access_token, refresh_token, expires_in, token_type, expiresAt, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    formData = new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        refresh_token: refreshToken,
                        grant_type: 'refresh_token'
                    });
                    return [4 /*yield*/, axios_1.default.post(OAUTH_TOKEN_URL, formData.toString(), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })];
                case 1:
                    response = _b.sent();
                    _a = response.data, access_token = _a.access_token, refresh_token = _a.refresh_token, expires_in = _a.expires_in, token_type = _a.token_type;
                    expiresAt = Date.now() + (expires_in * 1000) - 60000;
                    return [2 /*return*/, {
                            access_token: access_token,
                            refresh_token: refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
                            expires_at: expiresAt,
                            token_type: token_type
                        }];
                case 2:
                    error_2 = _b.sent();
                    console.error('Error refreshing access token:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Saves token information to a file
 */
function saveTokenToFile(tokenInfo, filePath) {
    try {
        fs_1.default.writeFileSync(filePath, JSON.stringify(tokenInfo, null, 2));
        console.error("Token saved to ".concat(filePath));
    }
    catch (error) {
        console.error("Error saving token to ".concat(filePath, ":"), error);
    }
}
/**
 * Loads token information from a file
 */
function loadTokenFromFile(filePath) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            var data = fs_1.default.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error("Error loading token from ".concat(filePath, ":"), error);
    }
    return null;
}
/**
 * Updates environment variables with token information
 */
function updateEnvWithToken(tokenInfo, envPath) {
    try {
        // Read existing .env file
        var envContent = '';
        if (fs_1.default.existsSync(envPath)) {
            envContent = fs_1.default.readFileSync(envPath, 'utf8');
        }
        // Replace or add OAUTH_TOKEN_BEARERAUTH
        var tokenRegex = /OAUTH_TOKEN_BEARERAUTH=.*/;
        var tokenLine = "OAUTH_TOKEN_BEARERAUTH=".concat(tokenInfo.access_token);
        if (tokenRegex.test(envContent)) {
            envContent = envContent.replace(tokenRegex, tokenLine);
        }
        else {
            envContent += "\n".concat(tokenLine);
        }
        // Write updated content back to .env file
        fs_1.default.writeFileSync(envPath, envContent);
        console.error("Updated .env file at ".concat(envPath));
        // Also update process.env for immediate use
        process.env.OAUTH_TOKEN_BEARERAUTH = tokenInfo.access_token;
    }
    catch (error) {
        console.error("Error updating .env file at ".concat(envPath, ":"), error);
    }
}
/**
 * Gets a valid token, refreshing if necessary
 */
function getValidToken(tokenStoragePath, clientId, clientSecret) {
    return __awaiter(this, void 0, void 0, function () {
        var tokenInfo, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    tokenInfo = loadTokenFromFile(tokenStoragePath);
                    // If no token or token is expired, try to refresh
                    if (!tokenInfo) {
                        console.error('No token found in storage');
                        return [2 /*return*/, null];
                    }
                    if (!(Date.now() >= tokenInfo.expires_at)) return [3 /*break*/, 3];
                    console.error('Token expired, attempting to refresh');
                    if (!tokenInfo.refresh_token) return [3 /*break*/, 2];
                    return [4 /*yield*/, refreshAccessToken(tokenInfo.refresh_token, clientId, clientSecret)];
                case 1:
                    tokenInfo = _a.sent();
                    // Save the refreshed token
                    saveTokenToFile(tokenInfo, tokenStoragePath);
                    return [3 /*break*/, 3];
                case 2:
                    console.error('No refresh token available');
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/, tokenInfo.access_token];
                case 4:
                    error_3 = _a.sent();
                    console.error('Error getting valid token:', error_3);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
