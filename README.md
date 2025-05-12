# Dexcom API MCP Servers

This repository contains three different MCP (Model Context Protocol) server implementations for the Dexcom API:

1. **stdio** - Command-line based server using stdio transport
2. **SSE** - Web-based server using Server-Sent Events transport
3. **streamableHttp** - Web-based server using StreamableHTTP transport

Each server provides the same Dexcom API tools but with different transport mechanisms.

## Quick Start

The easiest way to get started is to use the unified commands from the root directory:

```bash
# Install all dependencies
npm install

# Build all servers
npm run build:all

# Start the SSE web server (recommended for first-time users)
npm run start:sse
```

Then open http://localhost:3000 in your browser and follow the authentication flow.

## Authentication

All servers require authentication with the Dexcom API using OAuth2. You'll need to:

1. Register an application with Dexcom to get client credentials
2. Configure your server with these credentials
3. Authenticate with Dexcom to get an access token

### Registering with Dexcom

1. Visit the [Dexcom Developer Portal](https://developer.dexcom.com/)
2. Create an account and register a new application
3. Note your Client ID and Client Secret

### Configuration

Each server uses a `.env` file for configuration. When you first run a server, it will automatically create a `.env` file from the `.env.example` template if one doesn't exist.

Edit the `.env` file in the server directory you want to use and add your Dexcom credentials:

```
OAUTH_CLIENT_ID_BEARERAUTH=your_client_id_here
OAUTH_CLIENT_SECRET_BEARERAUTH=your_client_secret_here
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

## Server-Specific Usage

### stdio Server

The stdio server runs in the command line and uses a CLI-based OAuth flow:

```bash
# Run the authentication flow
npm run auth:stdio

# Start the server
npm run start:stdio

# For development with auto-reload
npm run dev:stdio
```

### SSE Server

The SSE server provides a web interface with built-in OAuth flow:

```bash
# Start the server
npm run start:sse

# For development with auto-reload
npm run dev:sse
```

Open http://localhost:3000 in your browser, click "Login with Dexcom" and follow the authentication flow.

### StreamableHTTP Server

The StreamableHTTP server also provides a web interface with built-in OAuth flow:

```bash
# Start the server
npm run start:http

# For development with auto-reload
npm run dev:http
```

Open http://localhost:3000 in your browser, click "Login with Dexcom" and follow the authentication flow.

## Available Tools

All servers provide the following Dexcom API tools:

- `getdatarange` - Get the available data range
- `userauthorization` - Get user authorization
- `exchangeauthorizationcode` - Exchange authorization code for token
- `getalerts` - Get alerts
- `getcalibrations` - Get calibrations
- `getestimatedglucosevalues` - Get estimated glucose values

## Using the Tools

### Web Interface (SSE and StreamableHTTP)

1. Log in with Dexcom using the "Login with Dexcom" button
2. Enter commands in the format: `toolName param1=value1 param2=value2`

Example:
```
getdatarange
```

```
getestimatedglucosevalues startDate=2023-01-01T00:00:00Z endDate=2023-01-02T00:00:00Z
```

### Command Line (stdio)

After starting the stdio server, enter commands in the same format:

```
getdatarange
```

## Token Management

OAuth tokens are automatically cached and refreshed when needed. The tokens are stored in:

- stdio: `stdio/data/token.json`
- SSE: `sse/data/token.json`
- StreamableHTTP: `streamableHttp/data/token.json`

## Development

This project uses a workspace structure to manage the three server implementations. Common code is shared in the `shared` directory.

### Project Structure

```
dexcom-api-mcp-servers/
├── shared/              # Shared utilities and configuration
├── stdio/               # Command-line server
├── sse/                 # Server-Sent Events web server
├── streamableHttp/      # StreamableHTTP web server
└── package.json         # Root workspace configuration
```

### Development Workflow

1. Make changes to the code
2. Run the appropriate dev script for auto-reloading:
    - `npm run dev:stdio` for stdio server
    - `npm run dev:sse` for SSE server
    - `npm run dev:http` for StreamableHTTP server

### Building

To build all servers:

```bash
npm run build:all
```

## Troubleshooting

### Authentication Issues

- Ensure your Dexcom Client ID and Secret are correct in the `.env` file
- Check that your redirect URI matches what's registered in the Dexcom Developer Portal
- If tokens expire, the servers will automatically refresh them if possible

### Connection Issues

- For web servers, ensure port 3000 is available (or change PORT in .env)
- For stdio server, check the console output for any error messages

### Data Issues

- Verify the date ranges you're requesting contain data
- Ensure your Dexcom account has access to the requested data
```