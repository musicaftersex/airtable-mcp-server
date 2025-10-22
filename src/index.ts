#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AirtableService } from './airtableService.js';
import { AirtableMCPServer } from './mcpServer.js';

const main = async () => {
  const apiKey = process.argv.slice(2)[0];
  const airtableService = new AirtableService(apiKey);
  const mcpServer = new AirtableMCPServer(airtableService);
  const transport = new StdioServerTransport();

  await mcpServer.connect(transport);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});