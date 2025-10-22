#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AirtableService } from './airtableService.js';
import { AirtableMCPServer } from './mcpServer.js';

const main = async () => {
  const apiKey = process.argv.slice(2)[0];
  if (apiKey) {
    console.warn(
      'warning (airtable-mcp-server): Passing in an API key as a command-line argument is deprecated and may be removed in a future version.'
    );
  }

  const airtableService = new AirtableService(apiKey);
  const server = new AirtableMCPServer(airtableService);
  const transport = new StdioServerTransport();

  // ✅ Important: connect before start
  await server.connect(transport);
  await transport.start();

  console.log('✅ Airtable MCP Server started');
};

main().catch((error: unknown) => {
  console.error('❌ MCP Server failed:', error);
  process.exit(1);
});
