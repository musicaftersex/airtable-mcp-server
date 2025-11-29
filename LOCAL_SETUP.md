# Local Setup Guide

This guide explains how to run the Airtable MCP Server locally and make it accessible to AI agents running on self-hosted platforms like n8n.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Airtable API key (Personal Access Token)
- (Optional) Docker for containerized deployment

## Local Development Setup

### 1. Install Dependencies

```bash
git clone https://github.com/musicaftersex/airtable-mcp-server.git
cd airtable-mcp-server
npm install
```

### 2. Configure API Key

Set your Airtable API key as an environment variable:

```bash
export AIRTABLE_API_KEY="your_airtable_personal_access_token"
```

Or create a `.env` file (add to `.gitignore`):
```
AIRTABLE_API_KEY=your_airtable_personal_access_token
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run Locally

```bash
npm start
```

Or run directly with API key as argument:
```bash
node bin/entrypoint.js your_airtable_personal_access_token
```

## Running as a Service

### Option 1: Using systemd (Linux)

Create a systemd service file at `/etc/systemd/system/airtable-mcp.service`:

```ini
[Unit]
Description=Airtable MCP Server
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/airtable-mcp-server
Environment="AIRTABLE_API_KEY=your_airtable_personal_access_token"
ExecStart=/usr/bin/node /path/to/airtable-mcp-server/bin/entrypoint.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable airtable-mcp.service
sudo systemctl start airtable-mcp.service
sudo systemctl status airtable-mcp.service
```

### Option 2: Using PM2

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'airtable-mcp-server',
    script: './bin/entrypoint.js',
    env: {
      AIRTABLE_API_KEY: 'your_airtable_personal_access_token',
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Option 3: Using Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV AIRTABLE_API_KEY=""

CMD ["node", "bin/entrypoint.js"]
```

Build and run:
```bash
docker build -t airtable-mcp-server .
docker run -d \
  --name airtable-mcp \
  -e AIRTABLE_API_KEY=your_airtable_personal_access_token \
  --restart unless-stopped \
  airtable-mcp-server
```

## Exposing MCP Server via HTTP (For n8n Integration)

The MCP server uses stdio transport by default, which doesn't work directly with HTTP-based AI agents. You need an MCP-to-HTTP proxy.

### Option 1: MCP Proxy Server

Create a simple HTTP proxy wrapper (`mcp-http-proxy.js`):

```javascript
import express from 'express';
import { spawn } from 'child_process';

const app = express();
app.use(express.json());

const MCP_SERVER_PATH = './bin/entrypoint.js';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

app.post('/mcp', async (req, res) => {
  try {
    const mcpProcess = spawn('node', [MCP_SERVER_PATH, AIRTABLE_API_KEY]);

    let responseData = '';
    let errorData = '';

    mcpProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
    mcpProcess.stdin.end();

    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: errorData });
      }

      try {
        const jsonResponse = JSON.parse(responseData);
        res.json(jsonResponse);
      } catch (e) {
        res.status(500).json({ error: 'Invalid JSON response from MCP server' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Proxy listening on port ${PORT}`);
});
```

Install dependencies and run:
```bash
npm install express
node mcp-http-proxy.js
```

### Option 2: Using MCP SSE (Server-Sent Events)

For better integration with AI agents, consider using the MCP SSE transport. Modify `src/index.ts`:

```typescript
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.post('/mcp/sse', async (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const airtableService = new AirtableService(apiKey);
  const mcpServer = new AirtableMCPServer(airtableService);
  const transport = new SSEServerTransport('/mcp/messages', res);

  await mcpServer.connect(transport);
});

app.listen(PORT, () => {
  console.log(`MCP SSE Server running on port ${PORT}`);
});
```

## Integration with n8n

### 1. n8n HTTP Request Node Configuration

In your n8n workflow, use the HTTP Request node:

**For MCP Proxy:**
- URL: `http://localhost:3000/mcp`
- Method: `POST`
- Authentication: None (or add Bearer token if you secure the proxy)
- Body:
  ```json
  {
    "tool": "list_bases",
    "arguments": {}
  }
  ```

**Example for listing records:**
```json
{
  "tool": "list_records",
  "arguments": {
    "baseId": "appXXXXXXXXXXXXXX",
    "tableId": "tblXXXXXXXXXXXXXX",
    "maxRecords": 100
  }
}
```

### 2. Available Tools

See the main README.md for all available tools. Key tools include:
- `list_bases` - List all accessible Airtable bases
- `list_tables` - List tables in a base
- `list_records` - Get records from a table
- `create_record` - Create a new record
- `update_records` - Update existing records
- `delete_records` - Delete records
- `create_comment` - Add comments to records
- `list_comments` - Get comments on records

### 3. Security Considerations

When exposing the MCP server via HTTP:

1. **API Key Protection:** Never expose your Airtable API key in requests. Keep it server-side only.

2. **Add Authentication:** Protect your proxy endpoint:
   ```javascript
   app.use((req, res, next) => {
     const apiKey = req.headers['x-api-key'];
     if (apiKey !== process.env.PROXY_API_KEY) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   });
   ```

3. **Rate Limiting:** Add rate limiting to prevent abuse:
   ```bash
   npm install express-rate-limit
   ```
   ```javascript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });

   app.use('/mcp', limiter);
   ```

4. **CORS:** If accessing from browser-based n8n:
   ```bash
   npm install cors
   ```
   ```javascript
   import cors from 'cors';
   app.use(cors({ origin: 'http://your-n8n-instance:5678' }));
   ```

## Troubleshooting

### MCP Server Not Starting
- Check that Node.js version is 18 or higher: `node --version`
- Verify API key is set: `echo $AIRTABLE_API_KEY`
- Check logs: `journalctl -u airtable-mcp.service -f` (systemd) or `pm2 logs airtable-mcp-server` (PM2)

### Connection Refused from n8n
- Verify the proxy server is running: `curl http://localhost:3000/health`
- Check firewall rules if running on different machines
- Ensure n8n can reach the server (test with `ping` or `telnet`)

### Invalid Responses
- Check MCP server logs for errors
- Validate JSON request format
- Ensure all required parameters are provided for the tool

## Advanced: Load Balancing Multiple Instances

For high-availability setups, run multiple instances behind nginx:

```nginx
upstream airtable_mcp {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    location /mcp {
        proxy_pass http://airtable_mcp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [n8n Documentation](https://docs.n8n.io/)
- [Airtable API Reference](https://airtable.com/developers/web/api/introduction)
